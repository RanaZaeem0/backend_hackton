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
import { BADREQUEST, INTERNALERROR } from "../constants/ResponseMessage";

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



const adminLogin = asyncHandler(async (req: Request, res: Response) => {
  const loginDataCheck = zod.object({
    email: zod.string(),
    password: zod.string(),
  });


  // get name,password
  const { email, password } = req.body;
  const validateLogin = loginDataCheck.safeParse({ email, password });
  console.log(req.body);
  
  if (!validateLogin.success) {
    throw new ApiError(402, "user Input is not correct");
  }
  // check the user is exict
  const user = await User.findOne({
    email: email,
  })

  if (!user) {
    throw new ApiError(404,'you are not admin',[]);
  }
   if (!user || !user.isAdmin) {
      throw new ApiError(BADREQUEST, "You are not an admin");
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

const adminLogout = asyncHandler(async (req: Request, res: Response) => {

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







export { adminLogin, adminLogout};