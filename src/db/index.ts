import mongoose, { MongooseError } from "mongoose"
import express from "express"
import { ApiError } from "../utils/apiError"
const app = express()


const connectDB = async () => {
    try {
      const MONGODB_URI = process.env.MONGODB_URI
      if(!MONGODB_URI){
      throw new ApiError(404,"cannot get dataBase Url")
      }
        const connectInstanse = await mongoose.connect(MONGODB_URI,{
            dbName:"hackton"
        })
        app.on('error',(error)=>{
            console.log(`erorr  ${error }`);
        })
        console.log(`your connect host ${connectInstanse.connection.host}`);
    } catch (error) {
        console.log(`Error ${error}`);
        process.exit(1)
    }
}






export default connectDB