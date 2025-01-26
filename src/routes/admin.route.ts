
import express from "express"
import { verifyJwt } from "../middleware/auth.middleware"
import { upload } from "../middleware/multer.middleware"
import { adminLogin, adminLogout } from "../controllers/admin.controller"

const adminRoute  = express.Router()


adminRoute.post('/login',adminLogin)
adminRoute.post('/logout',adminLogout)






adminRoute.get('/',(req,res)=>{
    res.json({
        msd:"User Routes " 
    })
})



export {adminRoute}
