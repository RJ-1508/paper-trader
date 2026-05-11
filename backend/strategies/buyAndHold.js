const buyAndHold = (prices) => {
    return [{ date: prices[0].date, action: 'BUY' }]
}

module.exports = buyAndHold