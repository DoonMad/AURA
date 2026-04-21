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

app.get("/join/:roomId", (req, res) => {
    const { roomId } = req.params;
    const deepLink = `aura://join/${roomId.toUpperCase()}`;

    // A minimal, sleek 'Redirection' page
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>AURA | Joining Room ${roomId}</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body { background: #09090B; color: #FAFAFA; font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
                .card { background: #18181B; padding: 2rem; border-radius: 1rem; border: 1px solid #27272A; text-align: center; max-width: 320px; }
                h1 { margin: 0 0 1rem; letter-spacing: 0.2rem; color: #22C55E; }
                p { opacity: 0.7; font-size: 0.9rem; margin-bottom: 2rem; }
                .btn { background: #E4E4E7; color: #09090B; padding: 0.8rem 2rem; text-decoration: none; border-radius: 0.5rem; font-weight: bold; display: inline-block; }
                .code { background: #27272A; padding: 0.2rem 0.5rem; border-radius: 0.3rem; font-family: monospace; }
            </style>
        </head>
        <body>
            <div class="card">
                <h1>AURA</h1>
                <p>You have been invited to join frequency <span class="code">${roomId.toUpperCase()}</span></p>
                <a href="${deepLink}" class="btn">JOIN MISSION</a>
                <p style="margin-top: 1.5rem; font-size: 0.7rem;">If the app doesn't open, ensure AURA is installed.</p>
            </div>
            <script>
                // Auto-redirect after a short delay
                setTimeout(() => {
                    window.location.href = "${deepLink}";
                }, 1000);
            </script>
        </body>
        </html>
    `);
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
