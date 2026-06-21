const express = require("express");
const { getChain } = require("../controllers/optionsController");
const router = express.Router();

router.get("/:underlying", getChain);
module.exports = router;
