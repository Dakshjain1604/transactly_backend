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
    const senderUser = await user.findById(req.userId).session(session);
    const recieverUser = await user.findById(to).session(session);
    const his=await history.create([{
        senderId:req.userId,
        recieverId:to,
        amount:amount,
        sender:senderUser.firstname,
        reciever:recieverUser.firstname,
        timeStamp:new Date()
    }], { session });

    await session.commitTransaction();
    res.json({
        message:"transfer sucessful"
    });
}

exports.getHistory = async (req, res) => {
    try {
      const userId = req.userId;
  
      const sent = await history.find({ senderId: userId });
      const recieved = await history.find({ recieverId: userId });
  
      return res.json({
        SentMoney: sent.map((h) => ({
          senderId: h.senderId,
          recieverId: h.recieverId,
          reciever: h.reciever, 
          amount: h.amount,
          timeStamp: h.timeStamp,
        })),
        RecievedMoney: recieved.map((h) => ({
          senderId: h.senderId,
          sender: h.sender, 
          receiverId: h.recieverId,
          amount: h.amount,
          timeStamp: h.timeStamp,
        })),
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: "Error fetching history",
        error: error.message,
      });
    }
  };