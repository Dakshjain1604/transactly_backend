const express=require("express");
const { authMiddleware } = require("../middleswares/auth");
const { getBalance, sendMoney } = require("../controllers/AcccountController");
const router=express.Router();



router.get("/balance",authMiddleware,getBalance);

router.post("/sendMoney",authMiddleware,sendMoney);

module.exports= router;
