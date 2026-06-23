const axios = require("axios");
const { parseOccSymbol } = require("../utils/occSymbol");
const { getOptionChain } = require("../providers/alpacaOptions");
const { getSpot } = require("../utils/getSpot");

const ENGINE = "http://localhost:8000";
const RISK_FREE = parseFloat(process.env.RISK_FREE_RATE);
const YEAR_TO_MS = 365 * 60 * 60 * 24 * 1000;

const getChain = async (req, res) => {
  try {
    const { underlying } = req.params;
    const snapshots = await getOptionChain(underlying, req.query);
    return res.status(200).json(snapshots);
  } catch (error) {
    return res.status(502).json({ error: "Options provider unreachable" });
  }
};

const enrichOne = async ([sym, snap], spot) => {
  const { strike, type, expiry } = parseOccSymbol(sym);
  const T = Math.max(
    (new Date(`${expiry}T20:00:00Z`) - Date.now()) / YEAR_TO_MS,
    1e-6,
  );
  const q = snap.latestQuote;
  const premium =
    q && q.bp > 0 && q.ap > 0 ? (q.bp + q.ap) / 2 : snap.latestTrade?.p;
  if (!premium) return null;
  const { data } = await axios.get(`${ENGINE}/iv`, {
    params: { market: premium, S: spot, K: strike, T, r: RISK_FREE, type },
  });
  return {
    symbol: sym,
    strike,
    type,
    expiry,
    bid: q?.bp,
    ask: q?.ap,
    premium,
    ...data,
  };
};
const getEnriched = async (req, res) => {
  try {
    const { underlying } = req.params;
    const spot = await getSpot(underlying);
    const snapshots = await getOptionChain(underlying, {
      strike_price_gte: spot * 0.85,
      strike_price_lte: spot * 1.15,
      limit: 60,
    });
    const rows = (
      await Promise.all(
        Object.entries(snapshots).map((e) => enrichOne(e, spot)),
      )
    )
      .filter(Boolean)
      .sort((a, b) => a.strike - b.strike);
    return res.status(200).json({ underlying, spot, rows });
  } catch (err) {
    return res.status(502).json({ error: "chain enrichment failed" });
  }
};
module.exports = { getChain, getEnriched };
