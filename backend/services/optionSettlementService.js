const {
  addShares,
  removeShares,
  sharesOwned,
} = require("../utils/shareHelpers");

const settlePosition = async (tx, position, S) => {
  const N = 100 * position.quantity;
  const K = Number(position.strike);
  const { portfolioId, underlying, optionType, direction } = position;
  const itm = optionType === "CALL" ? S > K : K > S;

  let cash = 0,
    status = "EXPIRED",
    evt = "EXPIRE";

  if (itm && direction === "LONG" && optionType === "CALL") {
    cash = -K * N;
    await addShares(tx, portfolioId, underlying, N, K);
    status = "EXERCISED";
    evt = "EXERCISE";
  } else if (itm && direction === "LONG" && optionType === "PUT") {
    const owned = await sharesOwned(tx, portfolioId, underlying);
    if (owned >= N) {
      cash = K * N;
      await removeShares(tx, portfolioId, underlying, N);
    } else {
      cash = (K - S) * N;
    }
    status = "EXERCISED";
    evt = "EXERCISE";
  } else if (itm && direction === "SHORT" && optionType === "CALL") {
    cash = K * N;
    await removeShares(tx, portfolioId, underlying, N);
    status = "ASSIGNED";
    evt = "ASSIGN";
  } else if (itm && direction === "SHORT" && optionType === "PUT") {
    cash = -K * N;
    await addShares(tx, portfolioId, underlying, N, K);
    status = "ASSIGNED";
    evt = "ASSIGN";
  } // otm taken care of by defaults (falls through)

  if (cash !== 0) {
    const p = await tx.portfolio.findUnique({ where: { id: portfolioId } });
    await tx.portfolio.update({
      where: { id: portfolioId },
      data: { cashBalance: Number(p.cashBalance) + cash },
    });
  }

  return tx.optionPosition.update({
    where: { id: position.id },
    data: {
      status,
      closedAt: new Date(),
      collateralCash: 0,
      reservedShares: 0,
      events: {
        create: {
          type: evt,
          quantity: position.quantity,
          price: K,
          cashEffect: cash,
        },
      },
    },
  });
};

module.exports = { settlePosition };
