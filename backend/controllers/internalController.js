const snapshotService = require('../services/snapshotService')

const snapshotAllPortfolios = async (req, res) => {
    try{
        await snapshotService.createSnapshotsForAll()
        return res.status(200).json({ message: 'Snapshot job complete' })
    } catch(error) {
        return res.status(500).json({error : 'Something went wrong'})
    }
}

module.exports = { snapshotAllPortfolios }