require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const http = require("http")
const socket = require("socket.io")
const { default: mongoose } = require("mongoose");
const errorMiddleware = require("./middleware/error.middleware");

const app = express();
const server = http.createServer(app)
const io = socket(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    method: ["GET", "POST"]
  }
})
// Middleware
app.use(express.json());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "PUT", "DELETE"],
  }),
);
app.use(cookieParser());
app.use("/api", require("./routes/index"));

app.use(errorMiddleware);

// socket
const addOnlineUser = (user, socketId) => {
  const checkUser = users.find((u) => u.user._id === user._id);
  if (!checkUser) {
    users.push({ user, socketId });
  }
};

const getSocketId = (userId) => {
  const user = users.find((u) => u.user._id === userId);
  return user ? user.socketId : null;
};
let users = []


io.on("connection", (socket) => {
  socket.on("addOnlineUser", (user) => {
    addOnlineUser(user, socket.id);
    io.emit("getOnlineUsers", users);
  });

  socket.on("createContact", ({ currentUser, receiver }) => {
    const receiverSocketId = getSocketId(receiver._id);
    if (receiverSocketId) {
      socket.to(receiverSocketId).emit("getCreatedUser", currentUser);
    }
  });

  socket.on("sendMessage", ({ newMessage, receiver, sender }) => {
    const receiverSocketId = getSocketId(receiver._id);
    if (receiverSocketId) {
      socket
        .to(receiverSocketId)
        .emit("getNewMessage", { newMessage, sender, receiver });
    }
  });

  socket.on("readMessages", ({ receiver, messages }) => {
    const receiverSocketId = getSocketId(receiver._id);
    if (receiverSocketId) {
      socket.to(receiverSocketId).emit("getReadMessages", messages);
    }
  });

  socket.on("updatedMessage", ({ updatedMessage, receiver, sender }) => {
    const receiverSocketId = getSocketId(receiver._id);
    if (receiverSocketId) {
      socket
        .to(receiverSocketId)
        .emit("getUpdateMessage", { updatedMessage, sender, receiver });
    }
  });
  socket.on(
    "deleteMessage",
    ({ deletedMessage, receiver, filteredMessages, sender }) => {
      const receiverSocketId = getSocketId(receiver._id);
      if (receiverSocketId) {
        socket
          .to(receiverSocketId)
          .emit("getDeleteMessage", {
            deletedMessage,
            filteredMessages,
            sender,
          });
      }
    },
  );

  socket.on("typing", ({ receiver, sender, message }) => {
    const receiverSocketId = getSocketId(receiver._id);
    if (receiverSocketId) {
      socket.to(receiverSocketId).emit("getTyping", { sender, message });
    }
  });
  socket.on("disconnect", () => {
    users = users.filter((u) => u.socketId !== socket.id);
    io.emit("getOnlineUsers", users);
  });
});
const bootstrap = async () => {
  try {
    const PORT = process.env.PORT || 6000;
    mongoose
      .connect(process.env.MONGO_URI)
      .then(() => console.log("Mongo DB connected"));
    server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
  } catch (error) {
    console.log(error);
  }
};

bootstrap();
