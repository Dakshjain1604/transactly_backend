const { user, Account } = require("../db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { JWT_SECRET } = require("../config");
const zod = require("zod");
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

  const findUser = await user.findOne({ username: req.body.username });
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

