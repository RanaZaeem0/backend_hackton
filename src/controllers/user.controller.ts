import { Request, Response } from "express";
import { User } from "../modules/user.model";
import { ApiError } from "../utils/apiError";

import { uploadOnCloudinary } from "../utils/cloudinary";
import zod from "zod";
import { ApiResponse } from "../utils/apiResponse";
import { asyncHandler } from "../utils/asyncHandler";
import {  mongooseIdVailder } from "../utils/features";
import mongoose from "mongoose";

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

const registerUser = asyncHandler(async (req: Request, res: Response) => {
  
    const UserDataCheck = zod.object({
      username: zod.string().min(2),
      email: zod.string(),
      password: zod.string().min(2),
    });

    //   take data from frontend
    const { username, password, email } = req.body;
  console.log(req.body);
  
    const validate = UserDataCheck.safeParse({
      username: username,
      password: password,
      email:email,
    });
    console.log(validate.data);
    
      
    if (!validate.success) {
      throw new ApiError(400, "user data is not valid");
    }
    
 
    const exictedUser = await User.findOne({
  username:username
    });
    
    if (exictedUser) {
      throw new ApiError(401, "User Name or name is Alredy Exicted");
    }
    

    const fileLocalPath = req?.file?.path



    let avatar 

    if(fileLocalPath){
      const uploadAvatar= await uploadOnCloudinary(fileLocalPath);
      avatar = {
        public_id: uploadAvatar?.public_id || "",
        url: uploadAvatar?.url || "",
      }
    }else{
      avatar = {
        public_id: "",
        url:"",
      }
    }



  


    const user = await User.create({
      username,
      email,
      password,
      avatar: avatar
    });

    console.log(user, "user ho ma");
    

    const { refreshToken, accessToken } = await generateAccessAndRefreshToken(
      user._id
    );

    if (!user) {
      throw new ApiError(401, "user is not creted");
    }

    const createdUser = await User.findOne(user._id).select(
      "-password -refreshToken"
    );

    if (!createdUser) {
      throw new ApiError(403, "User is not created in database");
    }

    const cookieOptions = {
      maxAge: 15 * 24 * 60 * 60 * 1000,
      sameSite: "none" as "none",
      httpOnly: true,
      secure: true,
    };
    return res
      .status(201)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .cookie("accessToken", accessToken, cookieOptions)

      .json(
        new ApiResponse(
          200,
          {
            user: createdUser,
            accessToken,
            refreshToken,
          },
          "User Created successFully "
        )
      );

});

const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const loginDataCheck = zod.object({
    username: zod.string(),
    password: zod.string(),
  });

  // get name,password
  const { username, password } = req.body;
  const validateLogin = loginDataCheck.safeParse({ username, password });
  
  if (!validateLogin.success) {
    throw new ApiError(402, "user Input is not correct");
  }
  // check the user is exict
  const user = await User.findOne({
    username: username,
  }).select('+password')

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

const searchUser = asyncHandler(async (req: Request, res: Response) => {
  const name = req.query.name;

  if (!name) {
    throw new ApiError(400, "name is required");
  }
   
  const user = await User.find({
    username: { $regex: `^${name}`, $options: "i" },
  });

  

  if (!user ||user.length === 0 ) {
    throw new ApiError(404, "user not found");
  }

  return res.json(new ApiResponse(200, user, "user found"));
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


export { loginUser,getUserDetails,registerUser, logoutUser,searchUser};