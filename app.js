
const postRouter = require('./Routes/postRoutes')
const userRouter = require('./Routes/userRoutes')
const commentRouter = require('./Routes/commentRoutes')
const cors = require("cors")
const express = require('express');
const dotenv = require("dotenv")
const morgan = require('morgan');
const app = express();
dotenv.config({path: './config.env'});

app.use(morgan('dev'))
app.use(express.json())
app.use(cors({
    origin: "http://localhost:5173", // Allow your frontend to access the backend
    credentials: true, // Allow cookies, authorization headers, etc.
    methods: ["GET", "POST", "PUT","PATCH", "DELETE"], // Allowed request methods
    allowedHeaders: ["Content-Type", "Authorization"] // Allow these headers in requests
}));
app.use('/zync/api/posts' , postRouter)

app.use('/zync/api/auth/user', userRouter)

app.use("/zync/api/comments", commentRouter)


//like routes are with post routes




module.exports = app;

