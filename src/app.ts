import cookieParser from "cookie-parser"
import express, { application } from "express"
import { userRoute } from "./routes/user.route"
import cors from "cors"
import corsOptions  from "./constants/config"
import mongoSanitize from "express-mongo-sanitize"
import { createApplication } from "./controllers/application.controller"
import { applicationRoute } from "./routes/appliction.route"
import { adminLogin } from "./controllers/admin.controller"
import { adminRoute } from "./routes/admin.route"
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

res.json({
    mea:"pk"
})
})
app.use('/api/v1/application',applicationRoute)

app.use('/api/v1/user',userRoute)
app.use('/api/v1/admin',adminRoute)



export default app