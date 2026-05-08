const axios = require('axios');
const getHoldingsWithPrices = require('../utils/getHoldingsWithPrices');
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

const getPortfolio = async (req, res) => {
    try {
        const portfolio = await prisma.portfolio.findUnique({
            where: { userId: req.userId },
            include: { holdings: true }
        })
        if (!portfolio) {
            return res.status(404).json({ error: 'Portfolio not found' })
        }
        const balance = Number(portfolio.cashBalance)
        const holdings = portfolio.holdings
        const holdingsWithPrices = await getHoldingsWithPrices(holdings);
        const holdingsVal = holdingsWithPrices.reduce((sum, h) => sum + h.currentValue, 0)
        return res.status(200).json({
            holdings: holdingsWithPrices,
            cashBalance: balance,
            totalPortfolioValue: holdingsVal + balance
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error : 'Something went wrong'})
    }
}

const getTransactions = async (req, res) => {
    try {
        const portfolio = await prisma.portfolio.findUnique({
            where: { userId: req.userId },
            include: {
                transactions: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        })
        if (!portfolio) {
            return res.status(404).json({ error: 'Portfolio not found' })
        }
        return res.status(200).json({ transactions: portfolio.transactions })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error : 'Something went wrong'})
    }
}

module.exports = { getPortfolio, getTransactions }
