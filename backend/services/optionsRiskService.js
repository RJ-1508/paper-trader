const axios = require("axios");
const { PrismaClient } = require("../generated/prisma");
const { getSpot } = require("../utils/getSpot");
const { getContractPremiums } = require("../utils/optionQuote");
const prisma = new PrismaClient();

const ENGINE = "http://localhost:8000";
const RISK_FREE = parseFloat(process.env.RISK_FREE_RATE);
const YEAR_TO_MS = 365 * 60 * 60 * 24 * 1000;
const GREEKS = ["delta", "gamma", "theta", "vega", "rho"];

const zeroGreeks = () => ({ delta: 0, gamma: 0, theta: 0, vega: 0, rho: 0 });

const enginePrice = async (S, K, T, sigma, type) => {
  const { data } = await axios.get(`${ENGINE}/price`, {
    params: { S, K, T, r: RISK_FREE, sigma, type },
  });
  return data.price;
};

const buildRow = async (pos, spot, premium) => {
  if (!premium) return null;
  const sign = pos.direction === "LONG" ? 1 : -1;
  const mult = 100 * pos.quantity;
  const scale = sign * mult;
  const strike = Number(pos.strike);
  const type = pos.optionType.toLowerCase();
  const T = Math.max((new Date(pos.expiry) - Date.now()) / YEAR_TO_MS, 1e-6);
  const { data } = await axios.get(`${ENGINE}/iv`, {
    params: { market: premium, S: spot, K: strike, T, r: RISK_FREE, type },
  });
  const row = {
    underlying: pos.underlying,
    occSymbol: pos.occSymbol,
    strike,
    type,
    T,
    sign,
    mult,
    spot,
    premium,
    impliedVol: data.implied_vol,
  };
  for (const g of GREEKS) {
    row[g] = data[g] * scale;
  }
  return row;
};

const buildBook = async (userId) => {
  const portfolio = await prisma.portfolio.findUnique({
    where: { userId },
    include: { holdings: true, optionPositions: { where: { status: "OPEN" } } },
  });
  if (!portfolio) throw new Error("Portfolio not found");

  const open = portfolio.optionPositions;
  const holdings = portfolio.holdings;
  const tickers = [
    ...new Set([
      ...open.map((p) => p.underlying),
      ...holdings.map((h) => h.ticker),
    ]),
  ];
  const spotList = await Promise.all(tickers.map((t) => getSpot(t)));
  const spots = {};
  tickers.forEach((t, i) => {
    spots[t] = spotList[i];
  });

  const premiums = await getContractPremiums(open.map((p) => p.occSymbol));
  const rows = (
    await Promise.all(
      open.map((p) => buildRow(p, spots[p.underlying], premiums[p.occSymbol])),
    )
  ).filter(Boolean);

  return { holdings, spots, rows };
};

const aggregate = (book) => {
  const net = zeroGreeks();
  const byUnderlying = {};
  const bucket = (ticker) => {
    if (!byUnderlying[ticker]) {
      byUnderlying[ticker] = { spot: book.spots[ticker], ...zeroGreeks() };
    }
    return byUnderlying[ticker];
  };

  for (const row of book.rows) {
    const b = bucket(row.underlying);
    for (const g of GREEKS) {
      b[g] += row[g];
      net[g] += row[g];
    }
  }

  for (const holding of book.holdings) {
    const quantity = Number(holding.quantity);
    bucket(holding.ticker).delta += quantity;
    net.delta += quantity;
  }

  return { net, byUnderlying };
};

const netGreeks = async (userId) => {
  const book = await buildBook(userId);
  const { net, byUnderlying } = aggregate(book);
  return { net, byUnderlying, asOf: new Date().toISOString() };
};

const approxScenario = (byUnderlying, dSpotPct, dVol, dt) => {
  const breakdown = { deltaPnl: 0, gammaPnl: 0, vegaPnl: 0, thetaPnl: 0 };
  for (const g of Object.values(byUnderlying)) {
    const dSpot = (g.spot * dSpotPct) / 100;
    breakdown.deltaPnl += g.delta * dSpot;
    breakdown.gammaPnl += 0.5 * g.gamma * dSpot * dSpot;
    breakdown.vegaPnl += g.vega * dVol;
    breakdown.thetaPnl += g.theta * dt;
  }
  const total =
    breakdown.deltaPnl +
    breakdown.gammaPnl +
    breakdown.vegaPnl +
    breakdown.thetaPnl;
  return { total, breakdown };
};

const repriceRow = async (row, dSpotPct, dVol, dt) => {
  const dSpot = (row.spot * dSpotPct) / 100;
  const shockSpot = row.spot + dSpot;
  const shockT = row.T - dt;
  const vNow = await enginePrice(row.spot, row.strike, row.T, row.impliedVol, row.type);
  const vShock =
    shockT <= 0
      ? row.type === "call"
        ? Math.max(shockSpot - row.strike, 0)
        : Math.max(row.strike - shockSpot, 0)
      : await enginePrice(shockSpot, row.strike, shockT, row.impliedVol + dVol, row.type);
  return row.sign * row.mult * (vShock - vNow);
};

const exactScenario = async (book, dSpotPct, dVol, dt) => {
  const contributions = await Promise.all(
    book.rows.map((row) => repriceRow(row, dSpotPct, dVol, dt)),
  );
  let total = contributions.reduce((s, c) => s + c, 0);
  for (const holding of book.holdings) {
    const dSpot = (book.spots[holding.ticker] * dSpotPct) / 100;
    total += Number(holding.quantity) * dSpot;
  }
  return total;
};

const runScenario = async (userId, { dSpotPct, dVolPts, dDays, mode }) => {
  const book = await buildBook(userId);
  const { net, byUnderlying } = aggregate(book);
  const dVol = dVolPts / 100;
  const dt = dDays / 365;

  const scenario = { mode, dSpotPct, dVolPts, dDays };
  if (mode === "exact") {
    scenario.total = await exactScenario(book, dSpotPct, dVol, dt);
  } else {
    const { total, breakdown } = approxScenario(byUnderlying, dSpotPct, dVol, dt);
    scenario.total = total;
    scenario.breakdown = breakdown;
  }

  return { net, scenario };
};

module.exports = { netGreeks, runScenario };
