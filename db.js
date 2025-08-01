const mongoose =require("mongoose");

require('dotenv').config();
const  MONGODB_URL=process.env.MONGODB_URL
const { timeStamp } = require("console");
const db=mongoose.connect(MONGODB_URL);

const userSchema=new mongoose.Schema({
    username:{type:String,unique:true},
    password:String,
    firstname:String,
    lastname:String
})

const Accountschema=new mongoose.Schema({
    userId:{type:mongoose.Types.ObjectId,ref:'user',required:true},
    balance:{type:Number,required:true}
})

const PaymentHistory=new mongoose.Schema({
    senderId:{type:mongoose.Types.ObjectId,ref:'user',required:true},
    sender:{type:String,ref:'user'},
    recieverId:{type:mongoose.Types.ObjectId,ref:'user',required:true},
    reciever:{type:String,ref:'user'},
    amount:{type:Number,required:true},
    timeStamp:{type:Date},
    transactionType:{String}
})

const OtpSchema=new mongoose.Schema({
    userId:{type:mongoose.Types.ObjectId,ref:'user',required:true},
    otp_code:{type:String},
    expiresAt:{type:Date},
})

const Account=mongoose.model("Account",Accountschema);
const user=mongoose.model("User",userSchema);
const history=mongoose.model("history",PaymentHistory);
const Otp=mongoose.model("Otp",OtpSchema);
module.exports={
    user,Account,history,Otp
}
