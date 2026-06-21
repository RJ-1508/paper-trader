const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const authRoutes = require("./routes/auth");
const marketRoutes = require("./routes/market");
const tradeRoutes = require("./routes/trade");
const portfolioRoutes = require("./routes/portfolio");
const internalRouter = require("./routes/internal");
const backtestRouter = require("./routes/backtest");
const pricingRoutes = require("./routes/pricing");
const optionRoutes = require("./routes/options");
const allowedOrigin = process.env.FRONTEND_URL || "*";
app.use(cors({ origin: allowedOrigin }));

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ message: "Paper Trader API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/market", marketRoutes);
app.use("/api/trade", tradeRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/internal", internalRouter);
app.use("/api/backtest", backtestRouter);
app.use("/api/pricing", pricingRoutes);
app.use("/api/options", optionRoutes);
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
