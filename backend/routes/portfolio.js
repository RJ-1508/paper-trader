const express = require('express');
const router = new express.Router()
const { getPortfolio, getTransactions } = require('../controllers/portfolioController')
const authenticate = require('../middleware/auth')

router.get('/', authenticate, getPortfolio)
router.get('/transactions', authenticate, getTransactions)

module.exports = router
