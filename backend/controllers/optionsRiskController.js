const { netGreeks, runScenario } = require("../services/optionsRiskService");

const getNetGreeks = async (req, res) => {
  try {
    const result = await netGreeks(req.userId);
    return res.status(200).json(result);
  } catch (error) {
    if (error.message === "Portfolio not found")
      return res.status(404).json({ error: "Portfolio not found" });
    console.error(error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};

const getScenario = async (req, res) => {
  try {
    const mode = req.query.mode === "exact" ? "exact" : "approx";
    const dSpotPct = Number(req.query.dSpotPct) || 0;
    const dVolPts = Number(req.query.dVolPts) || 0;
    const dDays = Number(req.query.dDays) || 0;
    const result = await runScenario(req.userId, {
      dSpotPct,
      dVolPts,
      dDays,
      mode,
    });
    return res.status(200).json(result);
  } catch (error) {
    if (error.message === "Portfolio not found")
      return res.status(404).json({ error: "Portfolio not found" });
    console.error(error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};

module.exports = { getNetGreeks, getScenario };
