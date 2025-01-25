import mongoose from "mongoose"
import { ApiError } from "../utils/apiError"

const connectDB = async () => {
    try {
        const MONGODB_URI = process.env.MONGODB_URI
        
        if (!MONGODB_URI) {
            throw new ApiError(404, "Cannot get database URL")
        }

        const connectInstance = await mongoose.connect(MONGODB_URI, {
            dbName: "hackathon"
        });

        console.log(`MongoDB Connected: ${connectInstance.connection.host}`);
        return connectInstance;
    } catch (error) {
        console.error(`Database Connection Error: ${error}`);
        process.exit(1);
    }
}

export default connectDB;