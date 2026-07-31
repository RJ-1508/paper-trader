const { performance } = require('perf_hooks');
const analyticsService = require('./services/analyticsService');

function generateSnapshots(n, startValue = 100000) {
    const snapshots = [];
    let value = startValue;
    const start = new Date('2019-01-02');
    for (let i = 0; i < n; i++) {
        value *= 1 + (Math.random() - 0.47) * 0.012;
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        snapshots.push({ snapshotAt: d, totalValue: parseFloat(value.toFixed(2)) });
    }
    return snapshots;
}

function bench(label, fn, runs = 20) {
    fn(); // warm-up
    const times = [];
    for (let i = 0; i < runs; i++) {
        const t0 = performance.now();
        fn();
        times.push(performance.now() - t0);
    }
    times.sort((a, b) => a - b);
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const mid = Math.floor(times.length / 2);
    const median = times.length % 2 === 0 ? (times[mid - 1] + times[mid]) / 2 : times[mid];
    console.log(`\n${label}`);
    console.log(`  Average : ${avg.toFixed(3)} ms`);
    console.log(`  Median  : ${median.toFixed(3)} ms`);
    console.log(`  Min     : ${times[0].toFixed(3)} ms`);
    console.log(`  Max     : ${times[times.length - 1].toFixed(3)} ms`);
}

const SNAPSHOTS = 1260; // ~5 years daily
const snapshots = generateSnapshots(SNAPSHOTS);

console.log(`\nAnalytics Benchmark — ${SNAPSHOTS} portfolio snapshots (~5 years daily), 20 runs\n`);
console.log('='.repeat(58));

bench(`totalReturn (${SNAPSHOTS} snapshots)`,   () => analyticsService.totalReturn(snapshots));
bench(`sharpeRatio (${SNAPSHOTS} snapshots)`,   () => analyticsService.sharpeRatio(snapshots));
bench(`maxDrawdown (${SNAPSHOTS} snapshots)`,   () => analyticsService.maxDrawdown(snapshots));
bench(`Full pipeline (all 3 metrics combined)`, () => {
    analyticsService.totalReturn(snapshots);
    analyticsService.sharpeRatio(snapshots);
    analyticsService.maxDrawdown(snapshots);
});

console.log('\n' + '='.repeat(58));
