const { availableCash, availableShares } = require("../utils/buyingPower");
const { parseOccSymbol } = require("../utils/occSymbol");

const createLeg = async (tx, portfolioId, leg, premium, reserve) => {
  const { occSymbol, direction, quantity } = leg;
  const {
    root: underlying,
    strike,
    type,
    expiry,
  } = parseOccSymbol(occSymbol);
  const notional = premium * 100 * quantity;
  const cashDelta = direction === "LONG" ? -notional : notional;

  const portfolio = await tx.portfolio.findUnique({ where: { id: portfolioId } });
  await tx.portfolio.update({
    where: { id: portfolioId },
    data: { cashBalance: Number(portfolio.cashBalance) + cashDelta },
  });

  const position = await tx.optionPosition.create({
    data: {
      portfolioId,
      underlying,
      optionType: type.toUpperCase(),
      strike,
      expiry,
      occSymbol,
      direction,
      quantity,
      openPremium: premium,
      collateralCash: reserve.collateralCash,
      reservedShares: reserve.reservedShares,
      structureId: reserve.structureId || null,
      status: "OPEN",
      events: {
        create: {
          type: "OPEN",
          quantity,
          price: premium,
          cashEffect: cashDelta,
        },
      },
    },
  });

  return { position, cashDelta };
};

const openLeg = async (tx, userId, leg, premium) => {
  const { occSymbol, direction, quantity } = leg;
  const { root: underlying, strike, type } = parseOccSymbol(occSymbol);

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
  const notional = premium * 100 * quantity;
  const reserve = { collateralCash: 0, reservedShares: 0 };

  if (direction === "LONG") {
    // long call or put
    if (cashAvail < notional) throw new Error("Insufficient buying power");
  } else if (type === "put") {
    // short put
    reserve.collateralCash = strike * 100 * quantity;
    if (cashAvail < reserve.collateralCash)
      throw new Error("Insufficient cash to secure put");
  } else {
    // short call
    reserve.reservedShares = 100 * quantity;
    if (availableShares(underlying, portfolio.holdings, open) < reserve.reservedShares)
      throw new Error("Not enough shares to cover call");
  }

  const { position } = await createLeg(tx, portfolio.id, leg, premium, reserve);
  return position;
};

const closeLeg = async (tx, position, premium) => {
  const closeNotional = premium * 100 * position.quantity;
  const openPremium = Number(position.openPremium);
  let cashDelta, realizedPnL;
  if (position.direction === "LONG") {
    cashDelta = closeNotional;
    realizedPnL = (premium - openPremium) * 100 * position.quantity;
  } else {
    cashDelta = -closeNotional;
    realizedPnL = (openPremium - premium) * 100 * position.quantity;
  }

  const portfolio = await tx.portfolio.findUnique({
    where: { id: position.portfolioId },
  });
  await tx.portfolio.update({
    where: { id: position.portfolioId },
    data: { cashBalance: Number(portfolio.cashBalance) + cashDelta },
  });

  const updated = await tx.optionPosition.update({
    where: { id: position.id },
    data: {
      status: "CLOSED",
      closePremium: premium,
      realizedPnL,
      closedAt: new Date(),
      collateralCash: 0,
      reservedShares: 0,
      events: {
        create: {
          type: "CLOSE",
          quantity: position.quantity,
          price: premium,
          cashEffect: cashDelta,
        },
      },
    },
  });

  return { position: updated, cashDelta, realizedPnL };
};

module.exports = { createLeg, openLeg, closeLeg };
