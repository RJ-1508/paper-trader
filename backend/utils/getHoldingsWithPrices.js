const axios = require('axios');

const getHoldingsWithPrices = async (holdings) => {
    const holdingsWithPrices = await Promise.all(
        holdings.map(async (holding) => {
            const response = await axios.get(
                'https://finnhub.io/api/v1/quote',
                {
                    params: {
                        symbol: holding.ticker,
                        token: process.env.FINNHUB_API_KEY
                    }
                }
            );

            const currPrice = response.data.c;
            const quantity = Number(holding.quantity);

            return {
                ...holding,
                currPrice,
                currentValue: currPrice * quantity
            };
        })
    );

    return holdingsWithPrices;
};

module.exports = getHoldingsWithPrices;