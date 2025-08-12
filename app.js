const express = require('express');
const http = require("http");
const { Server } = require("socket.io");
const morgan = require('morgan');
const cors = require("cors");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const Message = require("./Models/messageModel")

const postRouter = require('./Routes/postRoutes');
const userRouter = require('./Routes/userRoutes');
const commentRouter = require('./Routes/commentRoutes');

dotenv.config({ path: './config.env' });

const app = express(); // THIS is your Express app
const server = http.createServer(app); // HTTP server wraps Express

// Socket.IO instance
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

// Chat Authentication Middleware
io.use((socket, next) => {
    const { token } = socket.handshake.auth;
    if (!token) {
        return next(new Error("No token"));
    }

    try {
        const user = jwt.verify(token, process.env.SECRET_STRING);
        socket.user = user;
        console.log(socket.user);
        next();
    } catch (err) {
        next(new Error("Invalid token"));
    }
});

// Chat handling
io.on("connection", (socket) => {
    console.log("User Connected: ", socket.user);


    socket.join(socket.user.id)

    //listen to send Message
    socket.on("sendMessage", async ({ receiverId, text }) => {
        console.log("request to send message:", text )
    const message = new Message({
      sender: socket.user.id,
      receiver: receiverId,
      text,
      timestamp: new Date()
    });
    await message.save();

    socket.to(receiverId).emit("recieveMessage", message)

      socket.on("disconnect", () => {
    console.log("User disconnected:", socket.user.username);
  });

})})

// Middlewares
app.use(morgan('dev'));
app.use(express.json());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

// Routes
app.use('/zync/api/posts', postRouter);
app.use('/zync/api/auth/user', userRouter);
app.use("/zync/api/comments", commentRouter);

// Export the HTTP server, NOT the Express app
module.exports = server;
