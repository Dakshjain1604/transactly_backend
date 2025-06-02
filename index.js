const express=require("express");
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./swagger');
const app=express();
app.use(express.json());
const cors=require('cors');
app.use(cors());

// Swagger UI setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

//importing the routes
const userRoutes=require("./routes/userRoutes");
const AccountRoutes=require("./routes/AccountRoutes");

//calling the apis here
app.get("/",(req,res)=>{
    res.send("hi from 3000");
});

app.use('/user',userRoutes);
app.use('/account',AccountRoutes)

app.listen(3000);