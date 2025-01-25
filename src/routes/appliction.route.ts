
import express from "express"
import { verifyJwt } from "../middleware/auth.middleware"
import { sendAttachments, upload } from "../middleware/multer.middleware"
import { createApplication, LoadApprove } from "../controllers/application.controller"
import { uploadFilesToCloudinary, uploadOnCloudinary } from "../utils/cloudinary"
const applicationRoute  = express.Router()


applicationRoute.post('/createApplication',   (req, res, next) => {
    sendAttachments(req, res, (err) => {
        if (err) {
            return  null
        }
        // If we reach here, file upload was successful
        next();
    })
}
,createApplication)

applicationRoute.put("/loanApprove",LoadApprove)




applicationRoute.get('/',(req,res)=>{
    res.json({
        msd:"application Routes " 
    })
})



export {applicationRoute}
