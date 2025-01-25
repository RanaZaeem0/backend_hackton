import express from "express"

import dotenv from "dotenv"
import app from "./app.js"
import connectDB from "./db/index.js"
dotenv.config({
    path: './env'
})

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`Port is riuning on ${process.env.PORT}`);
    })
})
.catch((error)=>{
    console.log(`error occuse on db cone=nection ${error}`);
} )


