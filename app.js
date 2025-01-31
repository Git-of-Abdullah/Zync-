
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
app.use(cors())
app.use('/zync/api/posts' , postRouter)

app.use('/zync/api/auth/user', userRouter)

app.use("/zync/api/comments", commentRouter)


//like routes are with post routes




module.exports = app;

