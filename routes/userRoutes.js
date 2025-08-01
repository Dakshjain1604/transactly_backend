const express=require("express");
const router=express.Router();
const { signupUser, loginUser, updateUser, findUser,otpGen , verifyOtp} = require("../controllers/userController");
const {authMiddleware} =require("../middleswares/auth");

router.post('/signup',signupUser)

router.post("/signin",loginUser);

router.put('/update',authMiddleware,updateUser);

router.get('/find',findUser);

router.get('/Sendotp',authMiddleware,otpGen);
router.post('/verifyotp',authMiddleware,verifyOtp);

module.exports=router;