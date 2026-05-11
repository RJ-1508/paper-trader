const { sma } = require('../utils/indicators');

const movingAverageCrossover = (prices, fastWindow = 20, slowWindow = 50) => {
    const closes = prices.map(p => p.close);
    const fast = sma(closes, fastWindow);
    const slow = sma(closes, slowWindow);
    const signals = [];

    for (let i = slowWindow; i < closes.length; i++) {
        if (fast[i - 1] <= slow[i - 1] && fast[i] > slow[i]) {
            signals.push({ date: prices[i].date, action: 'BUY' });
        } else if (slow[i - 1] <= fast[i - 1] && slow[i] > fast[i]) {
            signals.push({ date: prices[i].date, action: 'SELL' });
        }
    }

    return signals;
};

module.exports = movingAverageCrossover;
