import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import registerSocketEventHandlers from "./socket";

const app = express();
app.use(cors());

const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
    },
});

io.on("connection", (socket) => {
    console.log(socket.id);
    registerSocketEventHandlers(socket, io);
})

server.listen(3000, () => {
    console.log("Server is running on port 3000");
});