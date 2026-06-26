const addShares = async (tx, portfolioId, ticker, qty, costPerShare) => {
  const existing = await tx.holding.findUnique({
    where: { portfolioId_ticker: { portfolioId, ticker } },
  });

  let newQty, newAvgPrice;
  if (existing) {
    const oldQty = Number(existing.quantity);
    const oldAvg = Number(existing.avgPrice);
    newQty = oldQty + qty;
    newAvgPrice = (oldQty * oldAvg + qty * costPerShare) / newQty;
  } else {
    newQty = qty;
    newAvgPrice = costPerShare;
  }

  await tx.holding.upsert({
    where: { portfolioId_ticker: { portfolioId, ticker } },
    update: { quantity: newQty, avgPrice: newAvgPrice },
    create: { portfolioId, ticker, quantity: newQty, avgPrice: newAvgPrice },
  });
};

const removeShares = async (tx, portfolioId, ticker, qty) => {
  const existing = await tx.holding.findUnique({
    where: { portfolioId_ticker: { portfolioId, ticker } },
  });
  if (!existing) throw new Error("No holding");
  const newQty = Number(existing.quantity) - qty;
  if (newQty < 0) throw new Error("Not enough shares");

  if (newQty === 0) {
    await tx.holding.delete({
      where: { portfolioId_ticker: { portfolioId, ticker } },
    });
  } else {
    await tx.holding.update({
      where: { portfolioId_ticker: { portfolioId, ticker } },
      data: { quantity: newQty },
    });
  }
};

const sharesOwned = async (tx, portfolioId, ticker) => {
  const holding = await tx.holding.findUnique({
    where: { portfolioId_ticker: { portfolioId, ticker } },
  });
  return holding ? Number(holding.quantity) : 0;
};

module.exports = { addShares, removeShares, sharesOwned };
