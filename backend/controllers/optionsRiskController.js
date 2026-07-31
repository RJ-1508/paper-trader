const { netGreeks, runScenario } = require("../services/optionsRiskService");

const ENGINE = "http://localhost:8000";

const isEngineFailure = (error) =>
  error.isAxiosError === true &&
  typeof error.config?.url === "string" &&
  error.config.url.startsWith(ENGINE);

// An engine that answers with an error status is a different failure from one that
// never answers, and the message has to say which so a port conflict is not read as
// a dead process.
const engineFailureMessage = (error) =>
  error.response ? "Pricing engine error" : "Pricing engine unreachable";

const getNetGreeks = async (req, res) => {
  try {
    const result = await netGreeks(req.userId);
    return res.status(200).json(result);
  } catch (error) {
    if (error.message === "Portfolio not found")
      return res.status(404).json({ error: "Portfolio not found" });
    if (isEngineFailure(error)) {
      console.error(error);
      return res.status(502).json({ error: engineFailureMessage(error) });
    }
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
    if (isEngineFailure(error)) {
      console.error(error);
      return res.status(502).json({ error: engineFailureMessage(error) });
    }
    console.error(error);
    return res.status(500).json({ error: "Something went wrong" });
  }
};

module.exports = { getNetGreeks, getScenario };
