const express = require('express');
const router = new express.Router()
const { buy } = require('../controllers/tradeController')
const authenticate = require('../middleware/auth')

router.post('/buy', authenticate, buy)
module.exports = router