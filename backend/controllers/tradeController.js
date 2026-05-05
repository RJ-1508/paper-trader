const axios = require('axios');
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

const buy = async (req, res) => {
    try {
        const { ticker, shares } = req.body;
        if (!ticker || !shares || shares <= 0) {
            return res.status(400).json({ error: 'Missing fields' });
        };
        const response = await axios.get('https://finnhub.io/api/v1/quote', {
                params: {
                    symbol: ticker,
                    token: process.env.FINNHUB_API_KEY
                }
        });
        if (!response.data || response.data.c === 0) {
            return res.status(404).json({error: "Ticker not found"});
        }
        const currPrice = response.data.c;
        const totalCost = currPrice * shares;
        const result = await prisma.$transaction(async (tx) => {

            const portfolio = await tx.portfolio.findUnique({
                where: { userId: req.userId },
            });

            if (!portfolio) {
                throw new Error('Portfolio not found');
            }

            const balance = Number(portfolio.cashBalance);

            if (totalCost > balance) {
                throw new Error('Insufficient funds')
            }

            const existingholding = await tx.holding.findUnique({
                where: {
                    portfolioId_ticker: {
                        portfolioId: portfolio.id,
                        ticker
                    }
                }    
            })
            let newQty, newAvgPrice;
            if (existingholding) {
                const oldQty = Number(existingholding.quantity)
                const oldAvg = Number(existingholding.avgPrice)

                newQty = oldQty + shares;
                newAvgPrice = ((oldQty * oldAvg) + totalCost) / newQty;
            } else {
                newQty = shares;
                newAvgPrice = currPrice;
            }

            await tx.holding.upsert({
                where:{
                    portfolioId_ticker: {
                        portfolioId: portfolio.id,
                        ticker
                    }
                },
                update: {
                    quantity: newQty,
                    avgPrice: newAvgPrice
                },
                create: {
                    portfolioId: portfolio.id,
                    ticker,
                    quantity: newQty,
                    avgPrice: newAvgPrice
                }
            })

            await tx.portfolio.update({
                where: {id: portfolio.id},
                data: {
                    cashBalance: {
                        decrement: totalCost
                    }
                }
            });

            const transactionRecord = await tx.transaction.create({
                data: {
                    portfolioId: portfolio.id,
                    ticker,
                    type: 'BUY',
                    quantity: shares,
                    price: currPrice,
                    totalAmount: totalCost
                }
            });
            return transactionRecord;
        })

        return res.status(200).json({
            message: 'Purchase successful',
            transaction: result
    })
    } catch (error) {
        if (error.message === 'Insufficient funds') {
            return res.status(400).json({ error: 'Balance too low' });
        }

        if (error.message === 'Portfolio not found') {
            return res.status(404).json({ error: 'Portfolio not found' });
        }

        console.error(error);
        return res.status(500).json({ error : 'Something went wrong'})
    }
}

module.exports = { buy }