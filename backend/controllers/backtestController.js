const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();
const strategies = require('../strategies')
const backtestEngine = require('../services/backtestEngine')
const analyticsService = require('../services/analyticsService')

const runBacktest = async (req, res) => {
    try{
        const { ticker, strategy, startDate, endDate } = req.body
        if (!ticker || !strategy || !startDate || !endDate) {
            return res.status(400).json({
                error: 'Missing required fields'
            });
        }
        const strategyFn = strategies[strategy];

        if (!strategyFn) {
            return res.status(400).json({
                error: 'Invalid strategy'
            });
        }

        const parsedStartDate = new Date(startDate);
        const parsedEndDate = new Date(endDate);
        if (
                isNaN(parsedStartDate.getTime()) ||
                isNaN(parsedEndDate.getTime())
            ) {
                return res.status(400).json({
                    error: 'Invalid date format'
                });
            }

        const result = await yahooFinance.chart(ticker, {
            period1: startDate,
            period2: endDate,
            interval: '1d'
        })

        const histData = result.quotes.map(d => ({
        date: d.date,
        close: d.close
        }));

        const signals = strategyFn(histData)
        const equityCurve = backtestEngine.runBacktest(histData, signals)
        const totalReturn = analyticsService.totalReturn(equityCurve)
        const sharpeRatio = analyticsService.sharpeRatio(equityCurve)
        const maxDrawdown = analyticsService.maxDrawdown(equityCurve)

        return res.status(200).json({
            equityCurve,
            metrics: { totalReturn, sharpeRatio, maxDrawdown },
            trades: signals.length  // how many trades were executed
        })

    } catch (error) {
        console.error(error)
        return res.status(500).json({ error: 'Something went wrong' })
    }
}

module.exports = runBacktest