import mongoose, { Schema, model } from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/apiError";
import { string } from "zod";


const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  isAdmin:{
  type:Boolean,
  default:false
  },
  phoneNumber:{
    type:String,
    required:true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  cnic: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  isFirstLogin: {
    type: Boolean,
    default: true
  },
  loanApplications: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LoanApplication'
  }],
  personalInformation: {
    address: String,
    phoneNumber: String
  }
}, { 
  timestamps: true 
});

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

UserSchema.methods.isPasswordCorrect = async function (password) {
  
  return await bcrypt.compare(password, this.password)
}
const cookieOptions = {
  maxAge: 15 * 24 * 60 * 60 * 1000,
  sameSite: "none",
  httpOnly: true,
  secure: true,
};
UserSchema.methods.generateAccessToken = function () {
  try {
      const expiresIn = process.env.ACCESS_TOKEN_EXPIRY ;
           const secret = process.env.ACCESS_TOKEN_SECRET
      
           if(!secret){
            throw new ApiError(500,"process.env.ACCESS_TOKEN_SECRET is not defined")
          }

           return jwt.sign(
          {
              _id: this._id,
              email: this.email,
              username: this.username,
          },
          secret,
      )
  } catch (error) {
      console.log(error + "creating accestoken");

  }





}
UserSchema.methods.generateRefreshToken = function () {
   const secret = process.env.REFRESH_TOKEN_SECRET
  if(!secret){
    throw new ApiError(500,"process.env.ACCESS_TOKEN_EXPIRY is not defined")
  }
  return jwt.sign({
      _id: this._id,
  },
      secret,
  )
}


export const User = mongoose.models.User || model("User", UserSchema);