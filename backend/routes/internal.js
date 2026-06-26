const internalAuth = require('../middleware/internalAuth')
const internalController = require('../controllers/internalController')
const express = require('express');
const router = express.Router()

router.use(internalAuth)
router.post('/snapshot-all', internalController.snapshotAllPortfolios)
router.post('/settle', internalController.settleExpired)

module.exports = router