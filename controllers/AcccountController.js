const express=require("express");
const { user, Account } = require("../db");
const mongoose=require("mongoose");

exports.getBalance=async(req,res)=>{
    const account=await Account.findOne({
        userId:req.userId
    })
    console.log(account)
    if(account){
            res.status(200).json({
                balance:account.balance
            })
    }
    else{
        res.status(411).json({
            message:"user not found!!"
        })
    }
}




exports.sendMoney=async(req,res)=>{
    const session =await mongoose.startSession();
    session.startTransaction();
    const {to,amount}=req.body;
    const account=await Account.findOne({userId:req.userId}).session(session);

    if(!account||account.balance<amount)
    {
        await session.abortTransaction();
        res.status(400).json({
            message:"insufficient balance"
        });
    }

    const toaccount=await Account.findOne({
        userId:to
    }).session(session);

    if(!toaccount){
        await session.abortTransaction();
        res.status(400).json({
            message:"invalid Account"
        });
    }
    await Account.updateOne({userId:req.userId},{$inc:{
        balance:-amount
    }
    }).session(session);
    await Account.updateOne({userId:to},{$inc:{
        balance:amount
    }
    }).session(session);

    await session.commitTransaction();
    res.json({
        message:"transfer sucessful"
    });

}