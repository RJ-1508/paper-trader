const axios = require('axios');
const getHoldingsWithPrices = require('../utils/getHoldingsWithPrices');
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();
const analyticsService = require('../services/analyticsService')
const benchmarkService = require('../services/benchmarkService')

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

const getPerformance = async (req, res) => {
    try {
        const userId = req.userId
        const portfolio = await prisma.portfolio.findUnique({
            where: { userId },
            select: { id: true }
        })
        if (!portfolio) {
            return res.status(404).json({ error: 'Portfolio not found' })
        }

        const range = req.query.range
        const rangeMap = { '1M': 30, '3M': 90, '1Y': 365 }
        const days = rangeMap[range]
        const cutoff = days ? new Date(Date.now() - days * 24 * 60 * 60 * 1000) : undefined

        const snapshots = await prisma.portfolioSnapshot.findMany({
            where: {
                portfolioId: portfolio.id,
                ...(cutoff && { snapshotAt: { gte: cutoff } })
            },
            select: {
                snapshotAt: true,
                totalValue: true
            },
            orderBy: { snapshotAt: 'asc' }
        })

        const performanceData = snapshots.map(s => ({
            timestamp: s.snapshotAt,
            value: Number(s.totalValue)
        }))
        return res.status(200).json({ performance: performanceData })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Something went wrong' })
    }
}

const getAnalytics = async (req, res) => {
    try {
        const userId = req.userId
        const portfolio = await prisma.portfolio.findUnique({
            where: { userId },
            select: { id: true }
        })
        if (!portfolio) {
            return res.status(404).json({ error: 'Portfolio not found' })
        }

        const snapshots = await prisma.portfolioSnapshot.findMany({
            where: { portfolioId: portfolio.id },
            select: {
                snapshotAt: true,
                totalValue: true
            },
            orderBy: { snapshotAt: 'asc' }
        })

        const totalReturn = analyticsService.totalReturn(snapshots)
        const sharpe = analyticsService.sharpeRatio(snapshots)
        const drawdown = analyticsService.maxDrawdown(snapshots)

        let spyReturn = null
        let alpha = null
        if (snapshots.length >= 2) {
            try {
                const startDate = snapshots[0].snapshotAt
                const endDate = new Date()
                spyReturn = await benchmarkService.getSpyTotalReturn(startDate, endDate)
                alpha = totalReturn - spyReturn
            } catch (err) {
                console.error('Benchmark fetch failed:', err)
            }
        }

        return res.status(200).json({ totalReturn, sharpeRatio: sharpe, maxDrawdown: drawdown, spyReturn, alpha })
    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Something went wrong' })
    }
}
module.exports = { getPortfolio, getTransactions, getPerformance, getAnalytics }
