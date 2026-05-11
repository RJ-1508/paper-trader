const runBacktest = require('../controllers/backtestController')
const strategies = require('../strategies')
const express = require('express');
const router = express.Router()

const listStrategies = (req, res) => res.status(200).json({ strategies: Object.keys(strategies) })

router.post('/', runBacktest)
router.get('/strategies', listStrategies)

module.exports = router