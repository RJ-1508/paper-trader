const axios = require("axios");

const getSpot = async (ticker) => {
    const { data } = await axios.get("https://finnhub.io/api/v1/quote", {
        params: { symbol: ticker, token: process.env.FINNHUB_API_KEY },
    });
    return data.c;
};

module.exports = { getSpot };
