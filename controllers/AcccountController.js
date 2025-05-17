const express=require("express");
const { user, Account,history } = require("../db");
const mongoose=require("mongoose");
const { timeStamp } = require("console");

exports.getBalance=async(req,res)=>{
    const account=await Account.findOne({
        userId:req.userId
    })
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

    if(!account||account.balance<amount ||account.balance<1)
    {
        await session.abortTransaction();
        return res.status(400).json({
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
        balance:-amount,
    }
    }).session(session);
    await Account.updateOne({userId:to},{$inc:{
        balance:amount,
    }
    }).session(session);

    const his=await history.create([{
        senderId:req.userId,
        recieverId:to,
        amount:amount,
        timeStamp:new Date()
    }], { session });

    console.log(his);
    await session.commitTransaction();
    res.json({
        message:"transfer sucessful"
    });
}


exports.getHistory=async(req,res)=>{
    const userId=req.userId;
    const sent=await history.find({
        senderId:userId
    });
    const recieved=await history.find({
        recieverId:userId
    })

    if(sent){
        res.json({
            Sent_Money:sent.map(history => ({
                senderId:history.senderId,
                recieverId:history.recieverId,
                amount:history.amount,
                timeStamp:history.timeStamp
            })),
            Recieved_Money:recieved.map(history=>({
                senderId:history.senderId,
                receiverId:history.recieverId,
                amount:history.amount,
                timeStamp:history.timeStamp
            }))
        })
    }
    else{
        res.status(400).json({
            message:"history not found or user is invalid"
        })
    }
}