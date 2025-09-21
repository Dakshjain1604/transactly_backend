const express = require("express");
const { user, Account, history } = require("../db");
const mongoose = require("mongoose");
const { redisClient } = require("../redisClient");

// GetBalance 
exports.getBalance = async (req, res) => {
  const cacheKey = `balance:${req.userId}`;

  // check cache
  const cachedBalance = await redisClient.get(cacheKey);
  if (cachedBalance) {
    return res.status(200).json({ balance: Number(cachedBalance) });
  }

  const account = await Account.findOne({ userId: req.userId });
  if (account) {
    await redisClient.setEx(cacheKey, 60, account.balance.toString()); // cache 1 min
    res.status(200).json({ balance: account.balance });
  } else {
    res.status(411).json({ message: "user not found!!" });
  }
};

// send Money 
exports.sendMoney = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  const { to, amount } = req.body;

  const account = await Account.findOne({ userId: req.userId }).session(session);
  if (!account || account.balance < amount || account.balance < 1) {
    await session.abortTransaction();
    return res.status(400).json({ message: "insufficient balance" });
  }

  const toAccount = await Account.findOne({ userId: to }).session(session);
  if (!toAccount) {
    await session.abortTransaction();
    return res.status(400).json({ message: "invalid Account" });
  }

  await Account.updateOne({ userId: req.userId }, { $inc: { balance: -amount } }).session(session);
  await Account.updateOne({ userId: to }, { $inc: { balance: amount } }).session(session);

  const senderUser = await user.findById(req.userId).session(session);
  const receiverUser = await user.findById(to).session(session);

  await history.create([{
    senderId: req.userId,
    recieverId: to,
    amount,
    sender: senderUser.firstname,
    reciever: receiverUser.firstname,
    timeStamp: new Date()
  }], { session });

  await session.commitTransaction();

  // invalidate balance cache for sender & receiver
  await redisClient.del(`balance:${req.userId}`);
  await redisClient.del(`balance:${to}`);

  res.json({ message: "transfer successful" });
};

// Get History 
exports.getHistory = async (req, res) => {
  try {
    const userId = req.userId;
    const cacheKey = `history:${userId}`;

    // cache
    const cachedHistory = await redisClient.get(cacheKey);
    if (cachedHistory) {
      return res.json(JSON.parse(cachedHistory));
    }

    const sent = await history.find({ senderId: userId });
    const received = await history.find({ recieverId: userId });

    const result = {
      SentMoney: sent.map(h => ({
        senderId: h.senderId,
        recieverId: h.recieverId,
        reciever: h.reciever,
        amount: h.amount,
        timeStamp: h.timeStamp,
      })),
      RecievedMoney: received.map(h => ({
        senderId: h.senderId,
        sender: h.sender,
        receiverId: h.recieverId,
        amount: h.amount,
        timeStamp: h.timeStamp,
      })),
    };

    await redisClient.setEx(cacheKey, 60, JSON.stringify(result)); // cache 1 min
    return res.json(result);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching history", error: error.message });
  }
};
