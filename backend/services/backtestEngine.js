const runBacktest = (prices, signals, initialCash = 100000) => {
    if (prices.length === 0) {
        return []
    }
    let cash = initialCash
    let shares = 0
    const equityCurve = []
    const signalMap = new Map();

    for (const signal of signals) {
        const dateKey = signal.date.toISOString().split('T')[0];
        signalMap.set(dateKey, signal);
    }

    for (const day of prices) {
        const dateKey = day.date.toISOString().split('T')[0];
        const signal = signalMap.get(dateKey);
        const price = day.close;

        if (signal) {
            if (signal.action === 'BUY' && shares === 0) {
                shares = cash / price
                cash = 0
            } else if (signal.action === 'SELL' && shares > 0) {
                cash = shares * price
                shares = 0
            }
        }
        let equity = cash + shares * price
        equityCurve.push({ date: day.date, totalValue: equity })
    }
    return equityCurve
} 

module.exports = { runBacktest }