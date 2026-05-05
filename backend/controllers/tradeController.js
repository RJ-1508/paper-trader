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

            const existingHolding = await tx.holding.findUnique({
                where: {
                    portfolioId_ticker: {
                        portfolioId: portfolio.id,
                        ticker
                    }
                }    
            })
            let newQty, newAvgPrice;
            if (existingHolding) {
                const oldQty = Number(existingHolding.quantity)
                const oldAvg = Number(existingHolding.avgPrice)

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

const sell = async (req, res) => {
    try {
        const { ticker, shares } = req.body;

        if (!ticker || !shares || shares <= 0) {
            return res.status(400).json({ error: 'Missing fields' });
        };

        const result = await prisma.$transaction(async (tx) => {
            const portfolio = await tx.portfolio.findUnique({
                where: { userId: req.userId },
            });

            if (!portfolio) {
                throw new Error('Portfolio not found')
            }

            const existingHolding = await tx.holding.findUnique({
                where: { portfolioId_ticker: { portfolioId: portfolio.id, ticker } }
            })

            if (!existingHolding) {
                throw new Error('No holding')
            }

            if (existingHolding.quantity < shares ) {
                throw new Error('Not enough stocks')
            }

            const response = await axios.get('https://finnhub.io/api/v1/quote', {
                params: {
                    symbol: ticker,
                    token: process.env.FINNHUB_API_KEY
                }
            });

            const qty = Number(existingHolding.quantity)
            const avg = Number(existingHolding.avgPrice)
            const sellPrice = response.data.c
            const totalValue = sellPrice * shares
            const newQty = qty - shares

            if (newQty === 0) {
                await tx.holding.delete({
                    where: { portfolioId_ticker: { portfolioId: portfolio.id, ticker } },
                })
            } else {
                await tx.holding.update({
                    where: { portfolioId_ticker: { portfolioId: portfolio.id, ticker } },
                    data: { quantity: newQty }
                })
            }
            const balance = Number(portfolio.cashBalance)
            const newBalance = balance + totalValue
            await tx.portfolio.update({
                where: {id: portfolio.id},
                data: {
                    cashBalance: newBalance
                }
            });

            const transactionRecord = await tx.transaction.create({
                data: {
                    portfolioId: portfolio.id,
                    ticker,
                    type: 'SELL',
                    quantity: shares,
                    price: sellPrice,
                    totalAmount: totalValue
                }
            })
            return transactionRecord
        })

        return res.status(200).json({
            message: 'Sale successful',
            transaction: result
        })
    } catch (error) {
        if (error.message === 'Portfolio not found') {
            return res.status(404).json({ error: 'Portfolio not found' });
        }

        if (error.message === 'No holding') {
            return res.status(404).json({ error: 'No such holding exists'})
        }

        if (error.message === 'Not enough stocks') {
            return res.status(400).json({ error : 'Not enough shares to sell'})
        }

        console.error(error)
        return res.status(500).json({ error : 'Something went wrong'})
    }
}
module.exports = { buy, sell }