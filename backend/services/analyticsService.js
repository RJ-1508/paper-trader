const dailyReturns = (snapshots) => {
    if (snapshots.length <= 1) {
        return []
    }

    let returns = [];

    for (let i = 1; i < snapshots.length; i++) {
        const curr = Number(snapshots[i].totalValue);
        const prev = Number(snapshots[i - 1].totalValue);

        if (prev === 0) {
            returns.push(0);
            continue;
        }

        returns.push((curr - prev) / prev);
    }

    return returns;
}

const totalReturn = (snapshots) => {
    if (snapshots.length < 2) return 0;
    const first = Number(snapshots[0].totalValue);
    if (first === 0) return 0;
    const last = Number(snapshots[snapshots.length - 1].totalValue);
    return (last - first) / first;
}

const sharpeRatio = (snapshots, riskFreeRate = 0) => {
    const returns = dailyReturns(snapshots);
    if (returns.length === 0) {
        return 0
    }
    const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    let squaredDiff = 0;
    for (const rtn of returns) {
        squaredDiff += (rtn - meanReturn) ** 2;
    }
    const stdevReturns = Math.sqrt(squaredDiff / (returns.length - 1));
    if (stdevReturns === 0) {
        return 0
    }
    return (meanReturn - riskFreeRate) / stdevReturns * Math.sqrt(252); //annualize
}

const maxDrawdown = (snapshots) => {
    if (snapshots.length === 0) return 0;
    let runningMax = Number.NEGATIVE_INFINITY;
    let maxDD = 0;
    for (const snapshot of snapshots) {
        const curr = Number(snapshot.totalValue);
        runningMax = Math.max(runningMax, curr);
        if (runningMax === 0) continue;
        const currDrawdown = (curr - runningMax) / runningMax;
        maxDD = Math.max(maxDD, Math.abs(currDrawdown));
    }
    return maxDD;
}

module.exports = {dailyReturns, totalReturn, sharpeRatio, maxDrawdown}