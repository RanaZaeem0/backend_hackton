import { Request, Response } from "express";
import { User } from "../modules/user.model";
import { ApiError } from "../utils/apiError";

import { uploadOnCloudinary } from "../utils/cloudinary";
import zod, { z } from "zod";
import { ApiResponse } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import {  mongooseIdVailder } from "../utils/features";
import mongoose from "mongoose";
import { sendMailPassword } from "../utils/nodeMailer";
import { INTERNALERROR } from "../constants/ResponseMessage";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();

    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return {
      accessToken,
      refreshToken,
    };
  } catch (error) {
    console.log(error + "acces tokn");

    throw new ApiError(
      500,
      "Somthing went wrong during cretion of acess token and refreshtoken"
    );
  }
};



const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const loginDataCheck = zod.object({
    cnic: zod.string(),
    password: zod.string(),
  });

  // get name,password
  const { cnic, password } = req.body;
  const validateLogin = loginDataCheck.safeParse({ cnic, password });
  
  if (!validateLogin.success) {
    throw new ApiError(402, "user Input is not correct");
  }
  // check the user is exict
  const user = await User.findOne({
    cnic: cnic,
  })

  if (!user) {
    throw new ApiError(404,'username or password is inCorrect',[]);
  }

  const passwordIsValide = await user.isPasswordCorrect(password);

  if (!passwordIsValide) {
    throw new ApiError(400, "passwrid is not valide");
  }
  const { refreshToken, accessToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loginUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!loginUser) {
    throw new ApiError(404, "login User is not there");
  }
  const cookieOptions = {
    maxAge: 15 * 24 * 60 * 60 * 1000,
    sameSite: "none" as "none",
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        {
          user: loginUser,
          accessToken,
          refreshToken,
        },
        "User logined in successFully "
      )
    );
});

const logoutUser = asyncHandler(async (req: Request, res: Response) => {

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    {
      new: true,
    }
  );

  const cookieOptions = {
    maxAge: 15 * 24 * 60 * 60 * 1000,
    sameSite: "none" as "none",
    httpOnly: true,
    secure: true,
  };

  return res
    .status(201)
    .clearCookie("refreshToken", cookieOptions)
    .clearCookie("accessToken", cookieOptions)
    .json(new ApiResponse(200, {}, "user logout sucees"));
});
const changePassword = asyncHandler(async (req: Request, res: Response) => {
  // Zod schema for validating the data
  const changePasswordSchema = z.object({
    currentPassword: z.string().min(6, "Current password is required"),
    newPassword: z.string().min(6, "New password is required").max(30, "New password cannot exceed 30 characters"),
  });

  // Extract the data from the request body
  const { currentPassword, newPassword } = req.body;

  // Validate the request data using Zod
  const validationResult = changePasswordSchema.safeParse({ currentPassword, newPassword });

  if (!validationResult.success) {
    throw new ApiError(402, "Invalid input data");
  }

  // Check if the user exists (from JWT or session)
  const userId = req.user._id;  // Assuming the user is authenticated and the ID is stored in req.user
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Check if the current password matches the one stored in the database
  const passwordIsValid = await user.isPasswordCorrect(currentPassword);

  if (!passwordIsValid) {
    throw new ApiError(400, "Current password is incorrect");
  }

  // Hash the new password and update the user's password in the database
  try {
    user.password = await user.hashPassword(newPassword);
    await user.save();  // Save the updated user

    res.json(
      new ApiResponse(200, null, "Password updated successfully")
    );
  } catch (error) {
    console.error(error);
    throw new ApiError(INTERNALERROR, "Error updating password");
  }
});










const getUserDetails = asyncHandler(async(req:Request,res:Response)=>{
    const user = req.user
    if(!user){
        throw new ApiError(401,"user not found")}
      
     const getUser = await User.findById(user._id)
     
     if(!getUser){
      throw new ApiError(401,"user not found")}

      return res.json(new ApiResponse(200,getUser,"user found"))

      
      })


export { loginUser,getUserDetails, logoutUser,changePassword};