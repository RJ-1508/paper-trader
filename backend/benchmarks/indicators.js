const { performance } = require('perf_hooks');
const { sma, computeRsi } = require('./utils/indicators');

function generateCloses(n, start = 150) {
    const arr = [start];
    for (let i = 1; i < n; i++) arr.push(Math.max(arr[i-1] * (1 + (Math.random()-0.47)*0.02), 1));
    return arr;
}

// Naive O(n*window) SMA for comparison
function smaNavie(closes, window) {
    const result = new Array(closes.length).fill(null);
    for (let i = window - 1; i < closes.length; i++) {
        let sum = 0;
        for (let j = i - window + 1; j <= i; j++) sum += closes[j];
        result[i] = sum / window;
    }
    return result;
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
    const median = times.length % 2 === 0 ? (times[mid-1]+times[mid])/2 : times[mid];
    console.log(`\n${label}`);
    console.log(`  Average : ${avg.toFixed(3)} ms`);
    console.log(`  Median  : ${median.toFixed(3)} ms`);
    console.log(`  Min     : ${times[0].toFixed(3)} ms`);
    console.log(`  Max     : ${times[times.length-1].toFixed(3)} ms`);
    return avg;
}

const N = 5040;
const closes = generateCloses(N);

console.log(`\nIndicators Benchmark — ${N} data points, 20 runs\n`);
console.log('='.repeat(58));

const optimizedAvg = bench(`SMA-50 optimized O(n)  (${N} points)`, () => sma(closes, 50));
const naiveAvg     = bench(`SMA-50 naive    O(n*w) (${N} points)`, () => smaNavie(closes, 50));
bench(`RSI-14                 (${N} points)`, () => computeRsi(closes, 14));
bench(`SMA-20 + SMA-50 combined`,             () => { sma(closes, 20); sma(closes, 50); });

console.log('\n' + '='.repeat(58));
console.log(`\nSpeedup: optimized SMA is ${(naiveAvg/optimizedAvg).toFixed(1)}x faster than naive`);
console.log('='.repeat(58));
