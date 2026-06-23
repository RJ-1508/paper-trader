function parseOccSymbol(sym) {
  const strike = parseInt(sym.slice(-8), 10) / 1000;
  const type = sym.slice(-9, -8) === "C" ? "call" : "put";
  const d = sym.slice(-15, -9);
  const root = sym.slice(0, -15);
  const expiry = `20${d.slice(0, 2)}-${d.slice(2, 4)}-${d.slice(4, 6)}`; //YYYY-MM-DD
  return { root, expiry, type, strike };
}

module.exports = { parseOccSymbol };
