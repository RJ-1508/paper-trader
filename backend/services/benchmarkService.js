const YahooFinance = require('yahoo-finance2').default;

const yahooFinance = new YahooFinance();

const getSpyHistorical = async (startDate, endDate) => {
    const result = await yahooFinance.chart('SPY', {
        period1: startDate,
        period2: endDate,
        interval: '1d'
    });

    const histData = result.quotes.map(d => ({
        date: d.date,
        close: d.close
    }));

    return histData;
};

const getSpyTotalReturn = async (startDate, endDate) => {
    const histData = await getSpyHistorical(startDate, endDate);

    if (histData.length === 0) {
        throw new Error('No SPY historical data returned');
    }

    const firstClose = histData[0].close;
    const lastClose = histData[histData.length - 1].close;

    return (lastClose - firstClose) / firstClose;
};

module.exports = {
    getSpyHistorical,
    getSpyTotalReturn
};