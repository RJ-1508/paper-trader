const express = require('express');
const router = new express.Router()
const { buy, sell } = require('../controllers/tradeController')
const authenticate = require('../middleware/auth')

router.post('/buy', authenticate, buy)
router.post('/sell', authenticate, sell)
module.exports = router