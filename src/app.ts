import cookieParser from "cookie-parser"
import express from "express"
import { userRoute } from "./routes/user.route"
import cors from "cors"
import corsOptions  from "./constants/config"
import { sendEmail } from "./utils/nodeMailer"
import mongoSanitize from "express-mongo-sanitize"
const app  = express()


app.use(express.json({ limit: '16kb' }))
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'))
app.use(cookieParser())
app.use(mongoSanitize())


app.use(cors({
    origin: [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "https://chat-frontend-peach.vercel.app"

      ],
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
}))


app.get('/api/v1/mail',(req,res)=>{
    sendEmail({
        email:"zain@gmail.com",
        message:"122121",
        subject:"user OTp"
    })
res.json({
    mea:"pk"
})
})

app.use('/api/v1/user',userRoute)


export default app