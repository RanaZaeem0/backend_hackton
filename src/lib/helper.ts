
import fs from "fs"
import { ApiError } from "../utils/apiError";
import { log } from "console";


export const getBase64 = async (file) =>{
  const fileBuffer = await fs.promises.readFile(file.path);  
    return `data:${file.mimetype};base64,${fileBuffer.toString("base64")}`;
}

export const unLinkFileOnError = async (files:any)=>{
files.map( async (file) =>{
  try {
    await fs.promises.unlink(file.path);
  } catch (error) {
    await fs.promises.unlink(file.path);
    
  }
})
}