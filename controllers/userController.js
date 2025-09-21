const { user, Account, Otp } = require("../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET;
const zod = require("zod");
const otpGenerator = require('otp-generator');
const nodemailer = require('nodemailer');
const { redisClient } = require('../redisClient'); // Redis client

// ------------------- SIGNUP -------------------
const signupBody = zod.object({
  username: zod.string().email(),
  firstname: zod.string(),
  lastname: zod.string(),
  password: zod.string(),
});

exports.signupUser = async (req, res) => {
  const parsed = signupBody.safeParse(req.body);
  if (!parsed.success) return res.status(411).json({ message: "Incorrect inputs" });

  const existingUser = await user.findOne({ username: req.body.username });
  if (existingUser) return res.status(411).json({ message: "Email already taken" });

  const hashedPassword = await bcrypt.hash(req.body.password, 3);
  const createdUser = await user.create({
    username: req.body.username,
    password: hashedPassword,
    firstname: req.body.firstname,
    lastname: req.body.lastname,
  });

  await Account.create({
    userId: createdUser._id,
    balance: 1 + Math.random() * 10000
  });

  // Cache new user
  await redisClient.setEx(`user:${createdUser.username}`, 300, JSON.stringify(createdUser));

  res.status(200).json({ message: "User created successfully" });
};

// ------------------- LOGIN -------------------
const signinBody = zod.object({
  username: zod.string().email(),
  password: zod.string(),
});

exports.loginUser = async (req, res) => {
  const parsed = signinBody.safeParse(req.body);
  if (!parsed.success) return res.status(411).json({ message: "Incorrect inputs" });

  try {
    const { username, password } = req.body;
    let findUser;

    // Check Redis cache first
    const cachedUser = await redisClient.get(`user:${username}`);
    if (cachedUser) {
      findUser = JSON.parse(cachedUser);
    } else {
      findUser = await user.findOne({ username });
      if (!findUser) return res.status(401).json({ message: "User not found" });

      await redisClient.setEx(`user:${username}`, 300, JSON.stringify(findUser));
    }

    const isPasswordCorrect = await bcrypt.compare(password, findUser.password);
    if (!isPasswordCorrect) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: findUser._id }, JWT_SECRET, { expiresIn: "1h" });
    return res.json({ token });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ------------------- UPDATE USER -------------------
const updateBody = zod.object({
  password: zod.string().optional(),
  firstname: zod.string().optional(),
  lastname: zod.string().optional(),
});

exports.updateUser = async (req, res) => {
  const { success } = updateBody.safeParse(req.body);
  if (!success) return res.status(411).json({ message: "invalid input" });

  try {
    const updateData = { ...req.body };
    if (updateData.password) updateData.password = await bcrypt.hash(updateData.password, 10);

    await user.updateOne({ _id: req.userId }, updateData);

    // Update Redis cache
    const updatedUser = await user.findById(req.userId);
    await redisClient.setEx(`user:${updatedUser.username}`, 300, JSON.stringify(updatedUser));

    res.status(200).json({ message: "Updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error during update", error: err.message });
  }
};

// ------------------- FIND USER -------------------
exports.findUser = async (req, res) => {
  const filter = req.query.filter || "";

  // Check Redis cache first
  const cachedUsers = await redisClient.get(`findUser:${filter}`);
  if (cachedUsers) {
    return res.json({ users: JSON.parse(cachedUsers) });
  }

  const users = await user.find({
    $or: [
      { firstname: { "$regex": filter, $options: "i" } },
      { lastname: { "$regex": filter, $options: "i" } }
    ]
  });

  const result = users.map(u => ({
    username: u.username,
    firstName: u.firstname,
    lastName: u.lastname,
    _id: u._id
  }));

  // Cache result for 30 seconds
  await redisClient.setEx(`findUser:${filter}`, 30, JSON.stringify(result));

  res.json({ users: result });
};

// ------------------- OTP -------------------
exports.otpGen = async (req, res) => {
  const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false });
  const userId = req.userId;

  try {
    const userr = await user.findById(userId);
    if (!userr) return res.status(404).json({ message: "User not found" });
    if (!userr.username) return res.status(400).json({ message: "User email not found" });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.transporter_email, pass: process.env.transporter_pass }
    });

    await transporter.sendMail({
      from: 'dakshjain080@gmail.com',
      to: userr.username,
      subject: 'Your OTP',
      text: `Your OTP is: ${otp}`
    });

    const expireTime = new Date(Date.now() + 5 * 60 * 1000);
    const existingOtp = await Otp.findOne({ userId });

    // Store OTP in Redis with 5 min expiry
    await redisClient.setEx(`otp:${userId}`, 300, otp);

    if (!existingOtp) {
      await Otp.create({ userId, otp_code: otp, expiresAt: expireTime });
    } else {
      await Otp.updateOne({ userId }, { otp_code: otp, expiresAt: expireTime });
    }

    res.json({ message: "OTP sent successfully" });

  } catch (exception) {
    console.error("OTP Error:", exception);
    res.status(500).json({ message: "Error sending OTP", error: exception.message });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const otp = req.body.otp;
    const userId = req.userId;

    // Check Redis first
    const cachedOtp = await redisClient.get(`otp:${userId}`);
    if (!cachedOtp) return res.status(400).json({ message: "OTP not found" });

    if (otp === cachedOtp) {
      // Optionally delete OTP after verification
      await redisClient.del(`otp:${userId}`);
      return res.status(200).json({ message: "OTP verified successfully" });
    } else {
      return res.status(400).json({ message: "Invalid OTP" });
    }

  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
