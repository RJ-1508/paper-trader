const express = require("express");
const { getChain, getEnriched } = require("../controllers/optionsController");
const router = express.Router();

router.get("/:underlying", getChain);
router.get("/:underlying/chain", getEnriched);
module.exports = router;
