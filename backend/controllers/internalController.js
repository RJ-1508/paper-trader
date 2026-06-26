const snapshotService = require('../services/snapshotService')
const { settleExpiredPositions } = require('../services/expiredSettlementService')

const snapshotAllPortfolios = async (req, res) => {
    try{
        await snapshotService.createSnapshotsForAll()
        return res.status(200).json({ message: 'Snapshot job complete' })
    } catch(error) {
        return res.status(500).json({error : 'Something went wrong'})
    }
}

const settleExpired = async (req, res) => {
    try {
        await settleExpiredPositions()
        return res.status(200).json({ message: 'Settlement job complete' })
    } catch (error) {
        return res.status(500).json({ error: 'Something went wrong' })
    }
}

module.exports = { snapshotAllPortfolios, settleExpired }