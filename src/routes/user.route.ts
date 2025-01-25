
import { loginUser,  } from "../controllers/user.controller"
import express from "express"
import { verifyJwt } from "../middleware/auth.middleware"
import { upload } from "../middleware/multer.middleware"

const userRoute  = express.Router()


userRoute.post('/login',loginUser)





userRoute.get('/',(req,res)=>{
    res.json({
        msd:"User Routes " 
    })
})



export {userRoute}
