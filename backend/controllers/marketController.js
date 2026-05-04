const axios = require('axios')
const getQuote = async (req, res) => {
    try {
        const ticker = req.params.ticker
        const response = await axios.get('https://finnhub.io/api/v1/quote', {
        params: {
            symbol: ticker,
            token: process.env.FINNHUB_API_KEY
        }
        });
        if (!response.data || response.data.c === 0) {
            return res.status(404).json({error: "Ticker not found"});
        }
        return res.status(200).json({currentPrice: response.data.c, high: response.data.h, low: response.data.l})
    } catch (error) {
        return res.status(500).json({error: "Something went wrong"})
    }
}

const searchSymbol = async (req, res) => {
    try {
        const searchStr = req.query.q
        if (!searchStr) {
            return res.status(400).json({ error: "No search query provided" });
        }
        const response = await axios.get('https://finnhub.io/api/v1/search', {
            params: {
                q: searchStr,
                token: process.env.FINNHUB_API_KEY
            }
        });
        if (!response.data.result || response.data.result.length === 0) {
            return res.status(404).json({error: "Ticker not found"});
        }
        const results = response.data.result.map(item => ({
            symbol: item.symbol,
            description: item.description
        }));
        return res.status(200).json(results);
    } catch (error) {
        return res.status(500).json({error: "Something went wrong"})
    }
}

module.exports = { getQuote, searchSymbol }