import mongoose from "mongoose";


const mongooseIdVailder = (id:string) => {
  if(mongoose.Types.ObjectId.isValid(id)){
    return true
  }else{
    return  false
  }
}





export   {mongooseIdVailder}
