import express from "express"
import dotenv from "dotenv"
import app from "./app"
import connectDB from "./db"

dotenv.config({
    path: './.env'  // Corrected path
})

const startServer = async () => {
    try {
        await connectDB();
        
        const PORT =   8000;
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error(`Server initialization failed: ${error}`);
        process.exit(1);
    }
}

startServer();