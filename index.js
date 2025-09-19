const express=require("express");
const app=express();
app.use(express.json());
const cors=require('cors');
require('dotenv').config();
const { connectRedis } = require('./redisClient');

app.use(cors({ origin: "*", credentials: true }));


  
//importing the routes
const userRoutes=require("./routes/userRoutes");
const AccountRoutes=require("./routes/AccountRoutes");

app.get("/",(req,res)=>{
    res.send("hi from 3000");
});

app.use('/user',userRoutes);
app.use('/account',AccountRoutes);

connectRedis().then(() => {
    console.log('Connected to Redis');
  }).catch(err => {
    console.error('Redis connection failed:', err);
  });

app.listen(3000);
