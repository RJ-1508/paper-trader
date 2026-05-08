const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const getHoldingsWithPrices = require('../utils/getHoldingsWithPrices');


const createSnapshot = async (portfolioId) => {
    const portfolio = await prisma.portfolio.findUnique({
        where : {id : portfolioId},
        include: {holdings: true}
    })
    if (!portfolio) {
        throw new Error('Portfolio not found');
    }
    const holdings = portfolio.holdings
    const holdingsWithPrices = await getHoldingsWithPrices(holdings);
    const holdingsValue = holdingsWithPrices.reduce((sum, h) => sum + h.currentValue, 0)
    const balance = Number(portfolio.cashBalance)
    const totalValue = holdingsValue + balance
    const snapshot = await prisma.portfolioSnapshot.create({
        data: {
            portfolioId: portfolioId,
            totalValue: totalValue,
            cashBalance: balance,
            holdingsValue: holdingsValue
        }
    })
    return snapshot
}


const createSnapshotsForAll = async () => {
    const portfolios = await prisma.portfolio.findMany({
        select: {id: true}
    })
    let successCount = 0
    for (const { id } of portfolios) {
        try {
            await createSnapshot(id);
            successCount++;
        } catch (error) {
            console.error(error)
        }
    }
    
    console.log(`Created snapshots for ${successCount}/${portfolios.length} portfolios`)
}

module.exports = { createSnapshot, createSnapshotsForAll }