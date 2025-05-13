const express=require("express");
const router=express.Router();
const { signupUser, loginUser, updateUser, findUser } = require("../controllers/userController");
const {authMiddleware} =require("../middleswares/auth");

router.post('/signup',signupUser)

router.post("/login",loginUser);

router.put('/update',authMiddleware,updateUser);

// router.get('/find',authMiddleware,findUser)

module.exports=router;