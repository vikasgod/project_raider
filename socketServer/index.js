import express from "express";
import http from "http";
import User from "./models/user.model.js";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { Server } from "socket.io";
dotenv.config();

const port = process.env.PORT || 5000;
const mongodbURI = process.env.MONGODB_URI;

const connectDB = async () => {
  try {
    await mongoose.connect(mongodbURI);
    console.log("DB connected");
  } catch (error) {
    console.log("db error", error);
  }
};

const app = express();
app.use(express.json());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NEXT_BASE_URL,
  },
});

app.post("/emit", async (req, res) => {
  const { event, userId, data } = req.body;
  try {
    const user = await User.findById(userId);
    if (user) {
      io.to(user.socketId).emit(event, data);
    }
    return res.json({ success: true });
  } catch (error) {
    return res.json({ success: false });
  }
});

io.on("connection", (socket) => {
  socket.on("identify", async (userId) => {
    socket.userId = userId;
    await User.findByIdAndUpdate(userId, {
      socketId: socket.id,
      isOnline: true,
    });
  });

  socket.on("update-location", async ({ userId, latitude, longitude }) => {
    console.log("111location updated");
    await User.findByIdAndUpdate(userId, {
      location: {
        type: "Point",
        coordinates: [longitude, latitude],
      },
    });
    console.log("location updated");
  });

  socket.on("join-ride",(bookingId)=>{
    socket.join(`ride-${bookingId}`);
  })

  socket.on("driver-location-update",({bookingId,latitude,longitude,status})=>{
    io.to(`ride-${bookingId}`).emit("driver-location",{
      bookingId,latitude,longitude,status
    })
  })

  socket.on("chat-message",(data)=>{
    io.to(`ride-${data.bookingId}`).emit("chat-message",data)
  })

  socket.on("disconnect", async () => {
    if (!socket.userId) return;
    await User.findByIdAndUpdate(socket.userId, {
      socketId: null,
      isOnline: false,
    });
  });
});

server.listen(port, () => {
  console.log(`listening on *:${port}`);
  connectDB();
});
