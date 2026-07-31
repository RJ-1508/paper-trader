const { performance } = require('perf_hooks');
const strategies = require('./strategies');
const backtestEngine = require('./services/backtestEngine');
const analyticsService = require('./services/analyticsService');

function generatePrices(n, startPrice = 150) {
    const prices = [];
    let price = startPrice;
    const start = new Date('2004-01-02');
    for (let i = 0; i < n; i++) {
        const pct = (Math.random() - 0.47) * 0.025;
        price = Math.max(price * (1 + pct), 1);
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        prices.push({ date: d, close: parseFloat(price.toFixed(4)) });
    }
    return prices;
}

function runTrial(strategyFn, prices) {
    const signals = strategyFn(prices);
    const curve = backtestEngine.runBacktest(prices, signals);
    analyticsService.totalReturn(curve);
    analyticsService.sharpeRatio(curve);
    analyticsService.maxDrawdown(curve);
    return signals.length;
}

function benchmarkStrategy(name, strategyFn, prices, runs = 15) {
    let signalCount = 0;
    const times = [];

    // warm-up run (not counted)
    runTrial(strategyFn, prices);

    for (let i = 0; i < runs; i++) {
        const t0 = performance.now();
        signalCount = runTrial(strategyFn, prices);
        times.push(performance.now() - t0);
    }

    times.sort((a, b) => a - b);
    const avg    = times.reduce((a, b) => a + b, 0) / times.length;
    const mid    = Math.floor(times.length / 2);
    const median = times.length % 2 === 0
        ? (times[mid - 1] + times[mid]) / 2
        : times[mid];

    return { avg, median, min: times[0], max: times[times.length - 1], signalCount };
}

const CANDLES = 5040; // ~20 years of daily trading data
const prices = generatePrices(CANDLES);

console.log(`\nBacktest Benchmark — ${CANDLES} candles (~20 years daily), 15 runs each\n`);
console.log('='.repeat(62));

for (const [name, fn] of Object.entries(strategies)) {
    const r = benchmarkStrategy(name, fn, prices);
    console.log(`\nStrategy: ${name}`);
    console.log(`  Signals generated : ${r.signalCount}`);
    console.log(`  Average           : ${r.avg.toFixed(2)} ms`);
    console.log(`  Median            : ${r.median.toFixed(2)} ms`);
    console.log(`  Min               : ${r.min.toFixed(2)} ms`);
    console.log(`  Max               : ${r.max.toFixed(2)} ms`);
}

console.log('\n' + '='.repeat(62));
