import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler";
import { LoanCategory, LoanSubcategory } from "../modules/loanApplication.model";
import { Request, Response } from "express";
import { LoanApplication } from "../modules/loanApplication.model"; // Adjust import path
import { unLinkFileOnError } from "../lib/helper";
import { ApiError } from "../utils/apiError";
import { uploadFilesToCloudinary } from "../utils/cloudinary";
import { ALREADYEXISTS, INTERNALERROR, NOTALLOWED } from "../constants/ResponseMessage";
import { User } from "../modules/user.model";
import { sendMailPassword } from "../utils/nodeMailer";
import { ApiResponse } from "../utils/apiResponse";
import uuid from "uuid"
import { BADREQUEST, UNAUTHORIZED } from "../constants/ResponseMessage";


// Define the Zod schema to validate the request body
const LoadApproveSchema = z.object({
  loadApplicationId: z.string().min(24, "Invalid Loan Application ID"), // Assuming MongoDB ObjectId length
  status: z.enum(["APPROVED", "REJECTED"], { message: "Status must be 'APPROVED' or 'REJECTED'" }) // Status must be either 'APPROVED' or 'REJECTED'
});

const WitnessSchema = z.object({
    name: z.string().min(2, "Witness name must be at least 2 characters"),
    cnic: z.string().regex(/^\d{13}$/, "CNIC must be 13 digits"),
    phoneNumber: z.string().regex(/^\d{10}$/, "Phone number must be 10 digits"),
    email: z.string().email("Invalid email format")
});


function generatePassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    let password = '';
    const length = 7
    for (let i = 0; i < length; i++) {
        password += chars[Math.floor(Math.random() * chars.length)];
    }
    
    return password;
 }

const LoanApplicationSchema = z.object({
    category: z.string().refine(
        (value) => Object.values(LoanCategory).includes(value as LoanCategory),
        { message: "Invalid loan category" }
    ),
    subcategory: z.string().refine(
        (value) => Object.values(LoanSubcategory).includes(value as LoanSubcategory),
        { message: "Invalid loan subcategory" }
    ),
    loanAmount: z.coerce.number().min(1000, "Loan amount must be at least 1000"),
    loanPeriod: z.coerce.number().min(1).max(5, "Loan period must be between 1-5 years"),
    initialDeposit: z.coerce.number().optional().default(0),
    name: z.string().min(2, "Guarantor name must be at least 2 characters"),
    email: z.string().email("Invalid email format"),
    location: z.string().min(2, "Location must be at least 2 characters"),
    phoneNumber:z.string().min(10),
    cnic: z.string().regex(/^\d{13}$/, "CNIC must be 13 digits"),
    witnesses1: WitnessSchema,
    witnesses2: WitnessSchema,
});



const createApplication = asyncHandler(async (req: Request, res: Response) => {
    // Convert form data to object
    console.log(req.body);
    const loanAmountt = Number(req.body.loanAmount);
const loanPeriodt = Number(req.body.loanPeriod);
const initialDepositt = Number(req.body.initialDeposit);

if (isNaN(loanAmountt)) {
    throw new ApiError(400, "loanAmount must be a valid number");
}
if (isNaN(loanPeriodt)) {
    throw new ApiError(400, "loanPeriod must be a valid number");
}
if (isNaN(initialDepositt)) {
    throw new ApiError(400, "initialDeposit must be a valid number");
}

  


    const { email, name, cnic,phoneNumber,category,subcategory, location, initialDeposit, loanPeriod, loanAmount, witnesses1, witnesses2 } = req.body;
    const files: any = req.files;
  console.log("valide");
  
    // Generate unique token
    function generateUniqueToken(): string {
        return `LN-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    }

    if (witnesses1.cnic === witnesses2.cnic) {
        throw new ApiError(208, "Witness CNICs must be different");
    }

    // Check email uniqueness
    if (witnesses1.email === witnesses2.email) {
        throw new ApiError(208, "Witness emails must be different");
    }

    // Check phone number uniqueness
    if (witnesses1.phoneNumber === witnesses2.phoneNumber) {
        throw new ApiError(208, "Witness phone numbers must be different");
    }


    const randomPassword = generatePassword();

    const userExited = await User.findOne({
        $or: [
            { email },
            { cnic }
        ]
   });

    if (userExited) {
        throw new ApiError(ALREADYEXISTS, "email or CNIC Already Existed");
    }

    const createUser = await User.create({
        email,
        cnic,
        name,
        password: randomPassword,
        phoneNumber:phoneNumber
    });

    if (!createUser) {
        throw new ApiError(INTERNALERROR, "Failed to create user");
    }

    const sendEmail = await sendMailPassword({ email, randomPassword });
    if (!sendEmail) {
        throw new ApiError(INTERNALERROR, "Unable to send email");
    }

    const initialDepositNum: number = Number(initialDeposit);
    const loanPeriodnum = Number(loanPeriod)
    const loanAmountNUm  =Number(loanAmount)

    const  witnesses1data = {email:witnesses1.email,phoneNumber:witnesses1.phoneNumber,cnic:witnesses1.cnic,name:witnesses1.name}
    // Fix the Loan Application creation and add correct properties
    const newLoanApplication = await LoanApplication.create({
        category: category,
        subcategory: subcategory,
        loanAmount:loanAmountt,
        loanPeriod:loanPeriodt,
        initialDeposit:initialDepositt,
        name,
        email,
        location,
        cnic,
        witnesses1data,
        witnesses2,
        user: createUser._id, // Corrected this line
        status: 'PENDING', // Corrected this line
        tokenNumber: generateUniqueToken() // Correctly included tokenNumber here
    });
     const uploadUser  = await User.findOneAndUpdate(
        { _id: createUser._id },
        {
            $push: {
                loanApplications: newLoanApplication._id
            }
        })

     if(!uploadUser){
         await LoanApplication.deleteOne(newLoanApplication._id);
         await User.deleteOne(createUser._id);
        throw new ApiError(INTERNALERROR,"cannot update the user")
     }




    res.json(new ApiResponse(201, newLoanApplication));
});

const LoadApprove = asyncHandler(async (req: Request, res: Response) => {
  // Validate the incoming request using Zod
  const validationResult = LoadApproveSchema.safeParse(req.body);

  if (!validationResult.success) {
    throw new ApiError(BADREQUEST, validationResult.error.errors[0].message);
  }

  const {  loadApplicationId, status } = validationResult.data;

  const userId = req.body.userId
//   const userId = req.user?.id
  if(!userId){
    throw new ApiError(BADREQUEST, "You are not an admin")
  }
  // Find the admin user based on the email
  const findAdmin = await User.findOne({ _id:userId });

  if (!findAdmin || !findAdmin.isAdmin) {
    throw new ApiError(BADREQUEST, "You are not an admin");
  }

  // Update the loan application based on the status
  let updateApplication;
  if (status === "REJECTED") {
    updateApplication = await LoanApplication.findByIdAndUpdate(
      loadApplicationId,
      {
        $set: { status: "REJECTED" } // Directly setting the status to "REJECTED"
      },
      { new: true }
    );
  } else if (status === "APPROVED") {
    updateApplication = await LoanApplication.findByIdAndUpdate(
      loadApplicationId,
      {
        $set: { status: "APPROVED" } // Directly setting the status to "APPROVED"
      },
      { new: true }
    );
  }

  // Check if the application was successfully updated
  if (!updateApplication) {
    throw new ApiError(404, "Application update error");
  }

  // Respond with success
  res.json(new ApiResponse(200, updateApplication, `Application ${status} successfully`));
});

const getAllApplications = asyncHandler(async (req: Request, res: Response) => {
    const AdminId = req.user?.id; // Assuming the admin's email is passed in the body
  
    
    // if(!AdminId){
    //     throw new ApiError(UNAUTHORIZED,"unauthorized not admin")
    // }
    // // Find the admin user based on the email
    // const findAdmin = await User.findOne({ AdminId });
  
    // if (!findAdmin || !findAdmin.isAdmin) {
    //   throw new ApiError(BADREQUEST, "You are not authorized to view all applications");
    // }
  
    // Fetch all loan applications
    const applications = await LoanApplication.find();
  
    // If no applications are found
    if (!applications || applications.length === 0) {
      throw new ApiError(404, "No loan applications found");
    }
  
    // Return the loan applications in the response
    res.json(new ApiResponse(200, applications, "All loan applications retrieved successfully"));
  });

export { createApplication,getAllApplications,LoadApprove };