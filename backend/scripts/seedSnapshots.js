const { PrismaClient } = require('../generated/prisma')
const prisma = new PrismaClient()

// Hardcoded for user ID 3 / portfolio ID 1 — change these to target a different portfolio,
// adjust the window length, or tune the starting values before running.
const PORTFOLIO_ID = 1
const DAYS = 30
const START_VALUE = 100000  // initial total portfolio value in USD
const CASH_BALANCE = 50000  // held flat across all snapshots; holdingsValue = totalValue - this

async function main() {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let value = START_VALUE

    for (let i = DAYS - 1; i >= 0; i--) {
        const date = new Date(today)
        date.setDate(today.getDate() - i)

        const drift = (Math.random() - 0.48) * 0.02 // slight upward bias
        value = value * (1 + drift)

        const totalValue = parseFloat(value.toFixed(2))
        const holdingsValue = parseFloat((totalValue - CASH_BALANCE).toFixed(2))

        await prisma.portfolioSnapshot.create({
            data: {
                portfolioId: PORTFOLIO_ID,
                totalValue,
                cashBalance: CASH_BALANCE,
                holdingsValue,
                snapshotAt: date
            }
        })

        console.log(`Day ${DAYS - i}/30 — ${date.toISOString().slice(0, 10)}: $${totalValue.toLocaleString()}`)
    }

    console.log('\nDone. 30 snapshots inserted for portfolio ID', PORTFOLIO_ID)
}

main()
    .catch(e => { console.error(e); process.exit(1) })
    .finally(() => prisma.$disconnect())
