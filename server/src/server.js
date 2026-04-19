import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import registerSocketEventHandlers from "./socket.js";
import mediasoupManager from "./mediasoup/mediasoupManager.js";

const app = express();
app.use(cors());

app.get("/health", (_req, res) => {
    res.json({ ok: true });
});

const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
    },
});

mediasoupManager.setIo(io);
console.log("[mediasoup] ANNOUNCED_IP =", process.env.MEDIASOUP_ANNOUNCED_IP || "(NOT SET - will use 0.0.0.0!)");
mediasoupManager.init().catch((error) => {
    console.error("Failed to initialize mediasoup worker", error);
    process.exit(1);
});

io.on("connection", (socket) => {
    console.log(socket.id);
    registerSocketEventHandlers(socket, io);
})

const PORT = Number(process.env.PORT ?? 3000);

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port ${PORT}`);
});
