const express=require("express");
const app=express();
app.use(express.json());
const cors=require('cors');
require('dotenv').config();

app.use(cors({ origin: "*", credentials: true }));

//importing the routes
const userRoutes=require("./routes/userRoutes");
const AccountRoutes=require("./routes/AccountRoutes");

app.get("/",(req,res)=>{
    res.send("hi from 3000");
});

app.use('/user',userRoutes);
app.use('/account',AccountRoutes);

app.listen(3000);
