import multer from "multer";
import path from 'path';
import { v4 as uuidv4 } from "uuid";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
        console.log("inside multer");
        
        const uniqueSuffix = uuidv4();
        const fileExtension = path.extname(file.originalname);
        const originalName = path.basename(file.originalname, fileExtension);
        const newFilename = `${originalName}-${uniqueSuffix}${fileExtension}`;
        cb(null, newFilename);
    }
});



export const upload = multer({storage})
export const sendAttachments = multer({
    storage: storage,
    limits: {
        files: 5 // Limit to 5 files per request
    }
}).any();


