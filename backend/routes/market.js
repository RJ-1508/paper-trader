const express = require('express');
const router = express.Router()
const {getQuote, searchSymbol} = require('../controllers/marketController')

router.get('/quote/:ticker', getQuote)
router.get('/search', searchSymbol)
module.exports = router