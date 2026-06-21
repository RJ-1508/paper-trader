const axios = require("axios");

const getOptionChain = async (underlying, params = {}) => {
    const response = await axios.get(`https://data.alpaca.markets/v1beta1/options/snapshots/${underlying}`, {
        headers: {
            'APCA-API-KEY-ID': process.env.ALPACA_KEY,
            'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET,
        },
        params: { feed: 'indicative', ...params },
    });
    return response.data.snapshots
}

module.exports = { getOptionChain}