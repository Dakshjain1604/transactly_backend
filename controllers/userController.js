const { user, Account,Otp } = require("../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require('dotenv').config();
const JWT_SECRET= process.env.JWT_SECRET;
const zod = require("zod");
const otpGenerator = require('otp-generator');
const nodemailer = require('nodemailer');

const signupBody = zod.object({
  username: zod.string().email(),
  firstname: zod.string(),
  lastname: zod.string(),
  password: zod.string(),
});
exports.signupUser = async (req, res) => {
  const parsed = signupBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(411).json({
      message: "Incorrect inputs",
    });
  }

  const existingUser = await user.findOne({ username: req.body.username });
  if (existingUser) {
    return res.status(411).json({
      message: "Email already taken",
    });
  }

  const hashedPassword = await bcrypt.hash(req.body.password, 10);
  const createdUser = await user.create({
    username: req.body.username,
    password: hashedPassword,
    firstname: req.body.firstname,
    lastname: req.body.lastname,
  });
  console.log(createdUser)

  const Userbalance = await Account.create({
    userId: createdUser._id,
    balance: 1 + Math.random() * 10000
  })

  res.status(200).json({
    message: "User created successfully",
  });

};



const signinBody = zod.object({
  username: zod.string().email(),
  password: zod.string(),
});
exports.loginUser = async (req, res) => {
  const parsed = signinBody.safeParse(req.body);
  console.log(parsed)
  if (!parsed.success) {
    return res.status(411).json({
      message: "Incorrect inputs",
    });
  }

  const findUser = await user.findOne({ username: req.body.username });
  console.log(findUser);
  if (!findUser) {
    return res.status(401).json({
      message: "User not found",
    });
  }

  const isPasswordCorrect = await bcrypt.compare(
    req.body.password,
    findUser.password
  );

  if (isPasswordCorrect) {
    const token = jwt.sign({ id: findUser._id }, JWT_SECRET);
    return res.json({ token });
  } else {
    return res.status(411).json({
      message: "Invalid password",
    });
  }
};



const updateBody = zod.object({
  password: zod.string().optional(),
  firstname: zod.string().optional(),
  lastname: zod.string().optional(),
});

exports.updateUser = async (req, res) => {
  const { success } = updateBody.safeParse(req.body);
  if (!success) {
    return res.status(411).json({
      message: "invalid input"
    });
  }
  try {
    const updateData = { ...req.body };
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    await user.updateOne({ _id: req.userId }, updateData);
    res.status(200).json({
      message: "Updated successfully"
    });
  } catch (err) {
    res.status(500).json({
      message: "Server error during update",
      error: err.message
    });
  }
};

exports.findUser = async (req, res) => {
  const filter = req.query.filter || "";
  console.log(filter)
  const users = await user.find({
    $or: [{
      firstname: {
        "$regex": filter,$options: "i" 
      }
    }, {
      lastname: {
        "$regex": filter,$options: "i" 
      }
    }]
  })
  res.json({
    users: users.map(user => ({
      username: user.username,
      firstName: user.firstname,
      lastName: user.lastname,
      _id: user._id
  }))
  })
}


exports.otpGen = async (req, res) => {
  const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false });
  const userId = req.userId;

  console.log("User ID:", userId);

  try {
    const userr = await user.findById(userId);

    if (!userr) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!userr.username) {
      return res.status(400).json({ message: "User email not found" });
    }

    const transporter = nodemailer.createTransport({ 
      service: 'gmail',
      auth: {
        user: process.env.transporter_email,
        pass: process.env.transporter_pass
      }
    });

    await transporter.sendMail({
      from: 'dakshjain080@gmail.com',
      to: userr.username,
      subject: 'Your OTP',
      text: `Your OTP is: ${otp}`
    });
    const existingOtp=await Otp.findOne({
        userId:userId
    })
    if(existingOtp===null){
      const createdOtp= await Otp.create({
        userId:req.userId,
        otp_code:otp,
        expiresAt:Date.now()+ 5 * 60 * 1000
      })
      console.log(createdOtp)
      return res.json({
        message: "OTP sent successfully",
        createdOtp
      });
    }else if(existingOtp!=null){
      const UpdatedOtp=await Otp.updateOne({
        userId:req.userId,
        otp_code:otp,
        expiresAt:Date.now()+ 5 * 60 * 1000
      })
      console.log(UpdatedOtp)
      return res.json({
        message: "OTP sent successfully",
        UpdatedOtp
      });

    }
    

  } catch (exception) {
    console.error("OTP Error:", exception);
    res.status(500).json({
      message: "Error sending OTP",
      error: exception.message
    });
  }
};



exports.verifyOtp= async (req, res) => {
  try {
    const { otp } = req.body;
    const userId = req.userId; // from token

    const CurrentOtp = await Otp.findById({
      userId:userId
    });

    if (!CurrentOtp.otp_code ) {
      return res.status(400).json({ message: "OTP not sent" });
    }

    await CurrentOtp.save()

    if (now > CurrentOtp.expiresAt) {
      return res.status(400).json({ message: "OTP expired" });
    }

    if (otp !== CurrentOtp.otp_code) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    // Optional: Clear OTP after use
    CurrentOtp.otp_code = undefined;
    await Otp.save();

    return res.status(200).json({ message: "OTP verified successfully" });

  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};
