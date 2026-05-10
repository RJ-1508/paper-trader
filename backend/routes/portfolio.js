const express = require('express');
const router = new express.Router()
const { getPortfolio, getTransactions, getPerformance, getAnalytics } = require('../controllers/portfolioController')
const authenticate = require('../middleware/auth')

router.get('/', authenticate, getPortfolio)
router.get('/transactions', authenticate, getTransactions)
router.get('/performance', authenticate, getPerformance)
router.get('/analytics', authenticate, getAnalytics)

module.exports = router
