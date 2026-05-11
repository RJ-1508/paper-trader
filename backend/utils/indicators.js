const sma = (closes, window) => {
    const result = new Array(closes.length).fill(null);

    for (let i = window - 1; i < closes.length; i++) {
        if (i === window - 1) {
            result[i] =
                closes
                    .slice(i - window + 1, i + 1)
                    .reduce((sum, p) => sum + p, 0) / window;
        } else {
            result[i] =
                (
                    result[i - 1] * window
                    - closes[i - window]
                    + closes[i]
                ) / window;
        }
    }

    return result;
};

const computeRsi = (closes, period) => {
    const result = new Array(closes.length).fill(null);
    const gains = [];
    const losses = [];

    for (let i = 1; i < closes.length; i++) {
        const change = closes[i] - closes[i - 1];
        gains.push(change > 0 ? change : 0);
        losses.push(change < 0 ? Math.abs(change) : 0);
    }

    // gains[j] is the gain for the move ending at closes[j+1],
    // so at closes index i, the current gains index is i-1
    let avgGain, avgLoss;

    for (let i = period; i < closes.length; i++) {
        if (i === period) {
            avgGain = gains.slice(0, period).reduce((sum, g) => sum + g, 0) / period;
            avgLoss = losses.slice(0, period).reduce((sum, l) => sum + l, 0) / period;
        } else {
            avgGain = (avgGain * period - gains[i - period - 1] + gains[i - 1]) / period;
            avgLoss = (avgLoss * period - losses[i - period - 1] + losses[i - 1]) / period;
        }

        if (avgLoss === 0) {
            result[i] = 100;
        } else {
            const RS = avgGain / avgLoss;
            result[i] = 100 - (100 / (1 + RS));
        }
    }

    return result;
};

module.exports = { sma, computeRsi };
