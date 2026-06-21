const express = require("express");
const router = new express.Router();
const { getPrice } = require("../controllers/pricingController");

router.get("/", getPrice);

module.exports = router;
