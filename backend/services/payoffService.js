const CURVE_POINTS = 301;
const CURVE_RANGE = 0.3;

const legPayoff = (leg, S) => {
  const intrinsic =
    leg.type === "call"
      ? Math.max(S - leg.strike, 0)
      : Math.max(leg.strike - S, 0);
  const perShare =
    leg.direction === "LONG" ? intrinsic - leg.premium : leg.premium - intrinsic;
  return perShare * 100 * leg.quantity;
};

const totalPayoff = (legs, S) =>
  legs.reduce((sum, leg) => sum + legPayoff(leg, S), 0);

const netDebitCredit = (legs) =>
  legs.reduce(
    (sum, leg) =>
      sum +
      (leg.direction === "LONG" ? -1 : 1) * leg.premium * 100 * leg.quantity,
    0,
  );

const netCallQuantity = (legs) =>
  legs
    .filter((leg) => leg.type === "call")
    .reduce(
      (sum, leg) => sum + (leg.direction === "LONG" ? 1 : -1) * leg.quantity,
      0,
    );

const analyticExtremes = (legs) => {
  const kinks = [0, ...legs.map((leg) => leg.strike)];
  const values = kinks.map((S) => totalPayoff(legs, S));
  return { min: Math.min(...values), max: Math.max(...values) };
};

const findBreakevens = (curve) => {
  const found = [];
  for (let i = 0; i < curve.length - 1; i++) {
    const a = curve[i];
    const b = curve[i + 1];
    if (a.payoff === 0) {
      found.push(a.S);
      continue;
    }
    if (a.payoff * b.payoff < 0)
      found.push(a.S + (-a.payoff * (b.S - a.S)) / (b.payoff - a.payoff));
  }
  const last = curve[curve.length - 1];
  if (last.payoff === 0) found.push(last.S);
  found.sort((x, y) => x - y);
  return found.filter((v, i) => i === 0 || v - found[i - 1] > 1e-9);
};

const buildPayoff = (legs, spot) => {
  const low = spot * (1 - CURVE_RANGE);
  const high = spot * (1 + CURVE_RANGE);
  const step = (high - low) / (CURVE_POINTS - 1);
  const curve = [];
  for (let i = 0; i < CURVE_POINTS; i++) {
    const S = low + i * step;
    curve.push({ S, payoff: totalPayoff(legs, S) });
  }

  const netCalls = netCallQuantity(legs);
  const extremes = analyticExtremes(legs);
  const expiries = [...new Set(legs.map((leg) => leg.expiry))].sort();

  return {
    spot,
    range: { low, high, points: CURVE_POINTS },
    curve,
    breakevens: findBreakevens(curve),
    maxProfit: netCalls > 0 ? null : extremes.max,
    maxLoss: netCalls < 0 ? null : extremes.min,
    unbounded: { upside: netCalls > 0, downside: netCalls < 0 },
    netDebitCredit: netDebitCredit(legs),
    expiry: expiries[0],
    mixedExpiries: expiries.length > 1,
  };
};

module.exports = {
  legPayoff,
  totalPayoff,
  netDebitCredit,
  netCallQuantity,
  analyticExtremes,
  buildPayoff,
};
