const { settlePosition } = require("./optionSettlementService");
const { getSpot } = require("../utils/getSpot");
const { PrismaClient } = require("../generated/prisma");
const prisma = new PrismaClient();

const settleExpiredPositions = async () => {
  const due = await prisma.optionPosition.findMany({
    where: { status: "OPEN", expiry: { lte: new Date() } },
  });

  const spots = {};
  for (const ticker of [...new Set(due.map((p) => p.underlying))]) {
    if (!(ticker in spots)) {
      spots[ticker] = await getSpot(ticker);
    }
  }

  let successCount = 0;
  for (const pos of due) {
    try {
      await prisma.$transaction((tx) =>
        settlePosition(tx, pos, spots[pos.underlying])
      );
      successCount++;
    } catch (error) {
      console.error(`Failed to settle position ${pos.id} (${pos.occSymbol}):`, error);
    }
  }
  console.log(`Settled ${successCount}/${due.length} expired positions`);
};

module.exports = { settleExpiredPositions };
