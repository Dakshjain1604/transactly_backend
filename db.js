const mongoose =require("mongoose");
const { optional, number } = require("zod");
const { MONGODB_URL } = require("./config");
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


const Account=mongoose.model("Account",Accountschema);
const user=mongoose.model("User",userSchema);

module.exports={
    user,Account,
}
