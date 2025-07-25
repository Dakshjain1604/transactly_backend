const express=require("express");
const { authMiddleware } = require("../middleswares/auth");
const { getBalance, sendMoney,getHistory } = require("../controllers/AcccountController");
const router=express.Router();

router.get("/balance",authMiddleware,getBalance);
router.post("/sendMoney",authMiddleware,sendMoney);
router.get("/getHistory",authMiddleware,getHistory);
module.exports= router;


