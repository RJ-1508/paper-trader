const { getOptionChain } = require("../providers/alpacaOptions");
const { parseOccSymbol } = require("./occSymbol");

const quoteMid = (snap) => {
  const q = snap?.latestQuote;
  return q && q.bp > 0 && q.ap > 0 ? (q.bp + q.ap) / 2 : snap?.latestTrade?.p ?? null;
};

const getContractPremium = async (occSymbol) => {
  const { root } = parseOccSymbol(occSymbol);
  const snapshots = await getOptionChain(root);
  return quoteMid(snapshots[occSymbol]);
};

const getContractPremiums = async (occSymbols) => {
  const roots = [...new Set(occSymbols.map((s) => parseOccSymbol(s).root))];
  const snapMap = {};
  for (const root of roots) {
    Object.assign(snapMap, await getOptionChain(root));
  }
  const premiums = {};
  for (const sym of occSymbols) {
    premiums[sym] = quoteMid(snapMap[sym]);
  }
  return premiums;
};

module.exports = { quoteMid, getContractPremium, getContractPremiums };
