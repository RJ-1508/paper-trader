const { performance } = require('perf_hooks');
const bcrypt = require('bcrypt');

const ROUNDS = 10;
const password = 'TestPassword123!';

async function main() {
    console.log(`\nAuth Benchmark — bcrypt hash + compare at ${ROUNDS} salt rounds, 10 runs\n`);
    console.log('='.repeat(52));

    // Hash benchmark
    const hashTimes = [];
    let hash;
    for (let i = 0; i < 10; i++) {
        const t0 = performance.now();
        hash = await bcrypt.hash(password, ROUNDS);
        hashTimes.push(performance.now() - t0);
    }
    hashTimes.sort((a, b) => a - b);
    const hashAvg = hashTimes.reduce((a, b) => a + b, 0) / hashTimes.length;
    const hashMid = Math.floor(hashTimes.length / 2);
    const hashMedian = (hashTimes[hashMid-1] + hashTimes[hashMid]) / 2;

    console.log(`\nbcrypt.hash (${ROUNDS} rounds)`);
    console.log(`  Average : ${hashAvg.toFixed(1)} ms`);
    console.log(`  Median  : ${hashMedian.toFixed(1)} ms`);
    console.log(`  Min     : ${hashTimes[0].toFixed(1)} ms`);
    console.log(`  Max     : ${hashTimes[hashTimes.length-1].toFixed(1)} ms`);

    // Compare benchmark
    const compareTimes = [];
    for (let i = 0; i < 10; i++) {
        const t0 = performance.now();
        await bcrypt.compare(password, hash);
        compareTimes.push(performance.now() - t0);
    }
    compareTimes.sort((a, b) => a - b);
    const compareAvg = compareTimes.reduce((a, b) => a + b, 0) / compareTimes.length;
    const compareMid = Math.floor(compareTimes.length / 2);
    const compareMedian = (compareTimes[compareMid-1] + compareTimes[compareMid]) / 2;

    console.log(`\nbcrypt.compare (${ROUNDS} rounds)`);
    console.log(`  Average : ${compareAvg.toFixed(1)} ms`);
    console.log(`  Median  : ${compareMedian.toFixed(1)} ms`);
    console.log(`  Min     : ${compareTimes[0].toFixed(1)} ms`);
    console.log(`  Max     : ${compareTimes[compareTimes.length-1].toFixed(1)} ms`);

    const throughput = (1000 / compareAvg).toFixed(1);
    console.log(`\n  => Effective login throughput: ~${throughput} req/s (single-threaded)`);
    console.log(`  => Brute-force cost: ${hashAvg.toFixed(0)}ms per attempt = ~${Math.round(3600000/hashAvg).toLocaleString()} attempts/hr (intentional)`);
    console.log('\n' + '='.repeat(52));
}

main().catch(console.error);
