const express = require("express");
const { getChain, getEnriched } = require("../controllers/optionsController");
const { openPosition, closePosition, listPositions, exercisePosition } = require("../controllers/optionsTradeController");
const { getNetGreeks, getScenario } = require("../controllers/optionsRiskController");
const authenticate = require("../middleware/auth");
const router = express.Router();

router.get("/positions", authenticate, listPositions);
router.post("/positions", authenticate, openPosition);
router.post("/positions/:id/close", authenticate, closePosition);
router.post("/positions/:id/exercise", authenticate, exercisePosition);

router.get("/greeks/net", authenticate, getNetGreeks);
router.get("/scenario", authenticate, getScenario);

router.get("/:underlying", getChain);
router.get("/:underlying/chain", getEnriched);

module.exports = router;
