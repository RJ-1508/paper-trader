const { PrismaClient } = require("../generated/prisma");
const { getOptionChain } = require("../providers/alpacaOptions");
const { parseOccSymbol } = require("../utils/occSymbol");
const { getSpot } = require("../utils/getSpot");
const { settlePosition } = require("../services/optionSettlementService");
const { openLeg, closeLeg } = require("../services/optionLegService");
const { closeStructureIfSettled } = require("../services/optionStructureService");
const prisma = new PrismaClient();

const openPosition = async (req, res) => {
  try {
    const { occSymbol, direction, quantity } = req.body;
    const { root: underlying } = parseOccSymbol(occSymbol);
    const snapshots = await getOptionChain(underlying);
    const snap = snapshots[occSymbol];
    const q = snap?.latestQuote;
    const premium =
      q && q.bp > 0 && q.ap > 0 ? (q.bp + q.ap) / 2 : snap?.latestTrade?.p;
    if (!premium) throw new Error("No market price available for contract");

    const result = await prisma.$transaction((tx) =>
      openLeg(tx, req.userId, { occSymbol, direction, quantity }, premium),
    );

    return res.status(201).json(result);
  } catch (error) {
    if (error.message === "Portfolio not found")
      return res.status(404).json({ error: "Portfolio not found" });
    if (error.message === "No market price available for contract")
      return res
        .status(502)
        .json({ error: "No market price available for contract" });
    if (error.message === "Insufficient buying power")
      return res.status(400).json({ error: "Insufficient buying power" });
    if (error.message === "Insufficient cash to secure put")
      return res.status(400).json({ error: "Insufficient cash to secure put" });
    if (error.message === "Not enough shares to cover call")
      return res.status(400).json({ error: "Not enough shares to cover call" });
    console.error(error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};

const closePosition = async (req, res) => {
  try {
    const { occSymbol, direction } = req.body;
    const { root: underlying } = parseOccSymbol(occSymbol);
    const snapshots = await getOptionChain(underlying);
    const snap = snapshots[occSymbol];
    const q = snap?.latestQuote;
    const premium =
      q && q.bp > 0 && q.ap > 0 ? (q.bp + q.ap) / 2 : snap?.latestTrade?.p;
    if (!premium) throw new Error("No market price available for contract");

    const result = await prisma.$transaction(async (tx) => {
      const portfolio = await tx.portfolio.findUnique({
        where: { userId: req.userId },
        });
      if (!portfolio) throw new Error("Portfolio not found");

      const position = await tx.optionPosition.findFirst({
        where: {
          portfolioId: portfolio.id,
          occSymbol,
          direction,
          status: "OPEN",
        },
      });

      if (!position) throw new Error("No open position found");
      if (position.structureId) throw new Error("Position belongs to a structure");

      const { position: updated } = await closeLeg(tx, position, premium);
      return updated;
    });

    return res.status(200).json(result);
  } catch (error) {
    if (error.message === "Portfolio not found")
      return res.status(404).json({ error: "Portfolio not found" });
    if (error.message === "No market price available for contract")
      return res
        .status(502)
        .json({ error: "No market price available for contract" });
    if (error.message === "No open position found")
      return res.status(404).json({ error: "No open position found" });
    if (error.message === "Position belongs to a structure")
      return res
        .status(400)
        .json({ error: "Position belongs to a structure; close the structure instead" });
    console.error(error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};

const listPositions = async (req, res) => {
  try {
    const portfolio = await prisma.portfolio.findUnique({
      where: { userId: req.userId },
      include: { optionPositions: { where: { status: "OPEN" } } },
    });
    if (!portfolio) return res.status(404).json({ error: "Portfolio not found" });

    const open = portfolio.optionPositions;
    const underlyings = [...new Set(open.map((p) => p.underlying))];
    const snapMap = {};
    for (const u of underlyings) {
      Object.assign(snapMap, await getOptionChain(u));
    }

    const positions = open.map((pos) => {
      const snap = snapMap[pos.occSymbol];
      const q = snap?.latestQuote;
      const mark =
        q && q.bp > 0 && q.ap > 0 ? (q.bp + q.ap) / 2 : snap?.latestTrade?.p ?? null;
      const openPremium = Number(pos.openPremium);
      const unrealizedPnL =
        mark != null
          ? pos.direction === "LONG"
            ? (mark - openPremium) * 100 * pos.quantity
            : (openPremium - mark) * 100 * pos.quantity
          : null;
      return { ...pos, mark, unrealizedPnL };
    });

    return res.status(200).json(positions);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};

const exercisePosition = async (req, res) => {
  try {
    const portfolio = await prisma.portfolio.findUnique({
      where: { userId: req.userId },
    });
    if (!portfolio) return res.status(404).json({ error: "Portfolio not found" });

    const position = await prisma.optionPosition.findFirst({
      where: {
        id: Number(req.params.id),
        portfolioId: portfolio.id,
        status: "OPEN",
        direction: "LONG",
      },
    });
    if (!position) return res.status(404).json({ error: "No exercisable position found" });

    const S = await getSpot(position.underlying);
    const result = await prisma.$transaction(async (tx) => {
      const settled = await settlePosition(tx, position, S);
      await closeStructureIfSettled(tx, position.structureId);
      return settled;
    });
    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};

module.exports = { openPosition, closePosition, listPositions, exercisePosition };
