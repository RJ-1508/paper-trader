const express = require('express');
const cors = require ('cors');
require('dotenv').config()

const app = express();
const PORT = process.env.PORT || 3000;
const authRoutes = require('./routes/auth')
const marketRoutes = require('./routes/market')
const tradeRoutes = require('./routes/trade')
const portfolioRoutes = require('./routes/portfolio')
const internalRouter = require('./routes/internal')
app.use(cors());
app.use(express.json());

app.get('/', (req, res)=>{
    res.json({message: "Paper Trader API is running"});
})

app.use('/api/auth', authRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/trade', tradeRoutes)
app.use('/api/portfolio', portfolioRoutes)
app.use('/api/internal', internalRouter)
app.listen(PORT,() => {
    console.log(`Server running on port ${PORT}`);
})