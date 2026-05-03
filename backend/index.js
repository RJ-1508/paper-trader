const express = require('express');
const cors = require ('cors');
require('dotenv').config

const app = express();
const PORT = process.env.PORT || 3000;
const authRoutes = require('./routes/auth')
app.use(cors());
app.use(express.json());

app.get('/', (req, res)=>{
    res.json({message: "Paper Trader API is running"});
})

app.listen(PORT,() => {
    console.log(`Server running on port $PORT$`);
})  

app.use('/api/auth', authRoutes);