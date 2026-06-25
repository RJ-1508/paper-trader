const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

const availableCash = (cashBalance, openPositions) =>
  Number(cashBalance) -
  openPositions.reduce((s, p) => s + Number(p.collateralCash), 0);

const availableShares = (ticker, holdings, openPositions) => {
  const owned = Number(
    holdings.find((h) => h.ticker === ticker)?.quantity || 0,
  );
  const reserved = openPositions
    .filter((p) => p.underlying === ticker)
    .reduce((s, p) => s + p.reservedShares, 0);
  return owned - reserved;
};

module.exports = { availableCash, availableShares };
