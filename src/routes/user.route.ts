
import { loginUser, registerUser, logoutUser,searchUser, getUserDetails } from "../controllers/user.controller"
import express from "express"
import { verifyJwt } from "../middleware/auth.middleware"
import { upload } from "../middleware/multer.middleware"

const userRoute  = express.Router()


userRoute.post('/login',loginUser)
userRoute.post('/new',registerUser)
userRoute.post('/logout',verifyJwt,logoutUser)
userRoute.get('/searchUser',searchUser)
userRoute.get('/me',verifyJwt,getUserDetails)




userRoute.get('/',(req,res)=>{
    res.json({
        msd:"User Routes " 
    })
})



export {userRoute}
