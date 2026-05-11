const { computeRsi } = require('../utils/indicators')

const rsi = (prices, period = 14, oversold = 30, overbought = 70) => {
    const closes = prices.map(p => p.close)
    const rsiValues = computeRsi(closes, period)
    const signals = []
    for (let i = period+1; i < prices.length; i++) {
        if (rsiValues[i] < oversold && rsiValues[i-1] >= oversold) {
            signals.push({ date: prices[i].date, action: 'BUY' });
        } else if (rsiValues[i] > overbought && rsiValues[i-1] <= overbought) {
            signals.push({ date: prices[i].date, action: 'SELL' });
        }
    }
    return signals
}

module.exports = rsi