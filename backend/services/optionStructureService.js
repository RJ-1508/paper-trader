const { PrismaClient } = require("../generated/prisma");
const { availableCash, availableShares } = require("../utils/buyingPower");
const { parseOccSymbol } = require("../utils/occSymbol");
const { getContractPremiums } = require("../utils/optionQuote");
const { getSpot } = require("../utils/getSpot");
const { createLeg, closeLeg } = require("./optionLegService");
const {
  buildPayoff,
  netDebitCredit,
  netCallQuantity,
  analyticExtremes,
} = require("./payoffService");
const prisma = new PrismaClient();

const validateLegs = (input) => {
  if (!Array.isArray(input) || input.length === 0)
    throw new Error("At least one leg required");
  for (const leg of input) {
    if (!leg || typeof leg.occSymbol !== "string" || !leg.occSymbol)
      throw new Error("Invalid leg");
    if (leg.direction !== "LONG" && leg.direction !== "SHORT")
      throw new Error("Invalid leg");
    if (!Number.isInteger(leg.quantity) || leg.quantity < 1)
      throw new Error("Invalid leg");
  }
};

const buildLegs = (input, premiums) =>
  input.map((leg) => {
    const premium = premiums[leg.occSymbol];
    if (!premium) throw new Error("No market price available for contract");
    const { root, strike, type, expiry } = parseOccSymbol(leg.occSymbol);
    return {
      occSymbol: leg.occSymbol,
      underlying: root,
      strike,
      type,
      expiry,
      direction: leg.direction,
      quantity: leg.quantity,
      premium,
    };
  });

const legsFromPositions = (positions) =>
  positions.map((pos) => ({
    occSymbol: pos.occSymbol,
    underlying: pos.underlying,
    strike: Number(pos.strike),
    type: pos.optionType.toLowerCase(),
    expiry: new Date(pos.expiry).toISOString().slice(0, 10),
    direction: pos.direction,
    quantity: pos.quantity,
    premium: Number(pos.openPremium),
  }));

const singleUnderlying = (legs) => {
  const underlyings = [...new Set(legs.map((leg) => leg.underlying))];
  if (underlyings.length > 1) throw new Error("Legs must share one underlying");
  return underlyings[0];
};

const structureRisk = (legs) => {
  const cashDelta = netDebitCredit(legs);
  const netCalls = netCallQuantity(legs);
  return {
    cashDelta,
    collateralCash: Math.max(0, cashDelta - analyticExtremes(legs).min),
    reservedShares: netCalls < 0 ? 100 * -netCalls : 0,
  };
};

const openStructure = async (userId, legsInput, label) => {
  validateLegs(legsInput);
  const premiums = await getContractPremiums(
    legsInput.map((leg) => leg.occSymbol),
  );
  const legs = buildLegs(legsInput, premiums);
  const underlying = singleUnderlying(legs);
  const risk = structureRisk(legs);

  return prisma.$transaction(async (tx) => {
    const portfolio = await tx.portfolio.findUnique({
      where: { userId },
      include: {
        holdings: true,
        optionPositions: { where: { status: "OPEN" } },
      },
    });
    if (!portfolio) throw new Error("Portfolio not found");

    const open = portfolio.optionPositions;
    const cashAvail = availableCash(portfolio.cashBalance, open);
    const needed = risk.collateralCash + Math.max(0, -risk.cashDelta);
    if (cashAvail < needed) throw new Error("Insufficient buying power");
    if (
      risk.reservedShares > 0 &&
      availableShares(underlying, portfolio.holdings, open) < risk.reservedShares
    )
      throw new Error("Not enough shares to cover call");

    const structure = await tx.optionStructure.create({
      data: {
        portfolioId: portfolio.id,
        label: label || `${underlying} ${legs.length}-leg`,
        status: "OPEN",
      },
    });

    for (let i = 0; i < legs.length; i++) {
      await createLeg(tx, portfolio.id, legs[i], legs[i].premium, {
        structureId: structure.id,
        collateralCash: i === 0 ? risk.collateralCash : 0,
        reservedShares: i === 0 ? risk.reservedShares : 0,
      });
    }

    return tx.optionStructure.findUnique({
      where: { id: structure.id },
      include: { legs: true },
    });
  });
};

const closeStructure = async (userId, id) => {
  const portfolio = await prisma.portfolio.findUnique({ where: { userId } });
  if (!portfolio) throw new Error("Portfolio not found");

  const structure = await prisma.optionStructure.findFirst({
    where: { id, portfolioId: portfolio.id, status: "OPEN" },
    include: { legs: { where: { status: "OPEN" } } },
  });
  if (!structure) throw new Error("No open structure found");

  const premiums = await getContractPremiums(
    structure.legs.map((leg) => leg.occSymbol),
  );
  for (const leg of structure.legs) {
    if (!premiums[leg.occSymbol])
      throw new Error("No market price available for contract");
  }

  return prisma.$transaction(async (tx) => {
    for (const leg of structure.legs) {
      await closeLeg(tx, leg, premiums[leg.occSymbol]);
    }
    const settled = await tx.optionPosition.findMany({
      where: { structureId: structure.id },
    });
    return tx.optionStructure.update({
      where: { id: structure.id },
      data: {
        status: "CLOSED",
        closedAt: new Date(),
        realizedPnL: settled.reduce(
          (sum, leg) => sum + Number(leg.realizedPnL || 0),
          0,
        ),
      },
      include: { legs: true },
    });
  });
};

const closeStructureIfSettled = async (tx, structureId) => {
  if (!structureId) return null;
  const remaining = await tx.optionPosition.count({
    where: { structureId, status: "OPEN" },
  });
  if (remaining > 0) return null;

  const legs = await tx.optionPosition.findMany({ where: { structureId } });
  return tx.optionStructure.updateMany({
    where: { id: structureId, status: "OPEN" },
    data: {
      status: "CLOSED",
      closedAt: new Date(),
      realizedPnL: legs.reduce((sum, leg) => sum + Number(leg.realizedPnL || 0), 0),
    },
  });
};

const markStructure = (structure, premiums) => {
  let unrealizedPnL = 0;
  let priced = true;
  const legs = structure.legs.map((leg) => {
    const mark = leg.status === "OPEN" ? premiums[leg.occSymbol] ?? null : null;
    const openPremium = Number(leg.openPremium);
    const legPnL =
      mark != null
        ? (leg.direction === "LONG"
            ? mark - openPremium
            : openPremium - mark) *
          100 *
          leg.quantity
        : null;
    if (legPnL == null) {
      if (leg.status === "OPEN") priced = false;
    } else {
      unrealizedPnL += legPnL;
    }
    return { ...leg, mark, unrealizedPnL: legPnL };
  });
  return {
    ...structure,
    legs,
    unrealizedPnL: priced ? unrealizedPnL : null,
    netDebitCredit: netDebitCredit(legsFromPositions(structure.legs)),
  };
};

const listStructures = async (userId) => {
  const portfolio = await prisma.portfolio.findUnique({ where: { userId } });
  if (!portfolio) throw new Error("Portfolio not found");

  const structures = await prisma.optionStructure.findMany({
    where: { portfolioId: portfolio.id, status: "OPEN" },
    include: { legs: true },
    orderBy: { openedAt: "desc" },
  });

  const symbols = structures.flatMap((s) => s.legs.map((leg) => leg.occSymbol));
  const premiums = symbols.length ? await getContractPremiums(symbols) : {};
  return structures.map((s) => markStructure(s, premiums));
};

const getStructure = async (userId, id) => {
  const portfolio = await prisma.portfolio.findUnique({ where: { userId } });
  if (!portfolio) throw new Error("Portfolio not found");

  const structure = await prisma.optionStructure.findFirst({
    where: { id, portfolioId: portfolio.id },
    include: { legs: true },
  });
  if (!structure) throw new Error("Structure not found");
  if (structure.legs.length === 0) throw new Error("Structure has no legs");

  const legs = legsFromPositions(structure.legs);
  const spot = await getSpot(singleUnderlying(legs));
  const premiums = await getContractPremiums(
    structure.legs.map((leg) => leg.occSymbol),
  );

  return { ...markStructure(structure, premiums), payoff: buildPayoff(legs, spot) };
};

const previewPayoff = async (legsInput) => {
  validateLegs(legsInput);
  const premiums = await getContractPremiums(
    legsInput.map((leg) => leg.occSymbol),
  );
  const legs = buildLegs(legsInput, premiums);
  const underlying = singleUnderlying(legs);
  const spot = await getSpot(underlying);
  return { underlying, legs, payoff: buildPayoff(legs, spot) };
};

module.exports = {
  openStructure,
  closeStructure,
  closeStructureIfSettled,
  listStructures,
  getStructure,
  previewPayoff,
};
