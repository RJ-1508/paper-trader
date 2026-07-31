const express = require("express");
const { getChain, getEnriched } = require("../controllers/optionsController");
const {
  openPosition,
  closePosition,
  listPositions,
  exercisePosition,
  listPositionEvents,
} = require("../controllers/optionsTradeController");
const { getNetGreeks, getScenario } = require("../controllers/optionsRiskController");
const {
  createStructure,
  getStructures,
  getOneStructure,
  postCloseStructure,
  postPayoff,
} = require("../controllers/optionsStructureController");
const authenticate = require("../middleware/auth");
const router = express.Router();

router.get("/positions", authenticate, listPositions);
router.post("/positions", authenticate, openPosition);
router.post("/positions/:id/close", authenticate, closePosition);
router.post("/positions/:id/exercise", authenticate, exercisePosition);
router.get("/positions/:id/events", authenticate, listPositionEvents);

router.get("/greeks/net", authenticate, getNetGreeks);
router.get("/scenario", authenticate, getScenario);

router.get("/structures", authenticate, getStructures);
router.post("/structures", authenticate, createStructure);
router.get("/structures/:id", authenticate, getOneStructure);
router.post("/structures/:id/close", authenticate, postCloseStructure);
router.post("/payoff", authenticate, postPayoff);

router.get("/:underlying", authenticate, getChain);
router.get("/:underlying/chain", authenticate, getEnriched);

module.exports = router;
