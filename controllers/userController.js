const { user, Account,Otp } = require("../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
require('dotenv').config();
const JWT_SECRET= process.env.JWT_SECRET;
const zod = require("zod");
const otpGenerator = require('otp-generator');
const nodemailer = require('nodemailer');
const {createClient}=require('redis')


const redisClient=createClient();
redisClient.connect();


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
  console.log(existingUser)
  if (existingUser) {
    return res.status(411).json({
      message: "Email already taken",
    });
  }

  const hashedPassword = await bcrypt.hash(req.body.password, 3);
  const createdUser = await user.create({
    username: req.body.username,
    password: hashedPassword,
    firstname: req.body.firstname,
    lastname: req.body.lastname,
  });
  

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

  if (!parsed.success) {
    return res.status(411).json({
      message: "Incorrect inputs",
    });
  }

  try {
    const { username, password } = req.body;
    let findUser;

    // 1. Check cache first
    const cachedUser = await redisClient.get(`user:${username}`);
    if (cachedUser) {
      findUser = JSON.parse(cachedUser);
    } else {
      // 2. Fetch from DB
      findUser = await user.findOne({ username }); // assuming `User` is your Mongoose/Sequelize model
      if (!findUser) {
        return res.status(401).json({ message: "User not found" });
      }

      // 3. Cache it (expire after 5 min)
      await redisClient.setEx(`user:${username}`, 300, JSON.stringify(findUser));
    }

    // 4. Validate password
    const isPasswordCorrect = await bcrypt.compare(password, findUser.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 5. Generate token
    const token = jwt.sign({ id: findUser._id }, JWT_SECRET, { expiresIn: "1h" });

    return res.json({ token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
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

    const existingOtp = await Otp.findOne({
      userId: userId
    });

    // Fix: Correct way to calculate expiry time
    const expireTime = new Date(Date.now() + 5 * 60 * 1000);

    if (!existingOtp) {
      const createdOtp = await Otp.create({
        userId: req.userId,
        otp_code: otp,
        expiresAt: expireTime
      });
      console.log(createdOtp);
      return res.json({
        message: "OTP sent successfully",
        createdOtp
      });
    } else {
      
      const UpdatedOtp = await Otp.updateOne(
        { userId: req.userId }, // filter criteria
        { 
          otp_code: otp, 
          expiresAt: expireTime 
        } 
      );
      console.log(UpdatedOtp);
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


exports.verifyOtp = async (req, res) => {
  try {
    const otp  = req.body.otp;
    const userId = req.userId; 

    
    const CurrentOtp = await Otp.find({
      userId: userId
    });
    

    if (!CurrentOtp) {
      return res.status(400).json({ message: "OTP not found" });
    }

    // if (!CurrentOtp.otp_code) {
    //   return res.status(400).json({ message: "OTP not sent" });
    // }

    
    const now = new Date();

    if (now > CurrentOtp.expiresAt) {
      return res.status(400).json({ message: "OTP expired" });
    }

    if (otp === CurrentOtp.otp_code) {
      return res.status(200).json({ message: "OTP verified successfully" });
    }
    else{
      return res.status(400).json({ message: "Invalid OTP" });
    }
    
    // await CurrentOtp.save(); // Use CurrentOtp.save(), not Otp.save()
    // // Clear OTP after successful verification
    // CurrentOtp.set('otp_code', undefined, { strict: false });
    // CurrentOtp.set('expiresAt', undefined, { strict: false });
    

    

  } catch (error) {
    console.error("Error verifying OTP:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};