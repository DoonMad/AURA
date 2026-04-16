import { io, Socket } from "socket.io-client";
import { BACKEND_URL } from "../config/network";

let socket: Socket | null = null;
console.log("Socket backend URL:", BACKEND_URL);

const getSocket = () => {
    if (!socket) {
        socket = io(BACKEND_URL, {
            transports: ["polling", "websocket"],
            autoConnect: true,
            timeout: 10000,
        });

        socket.on("connect", () => {
            console.log("Socket connected", socket?.id);
        });

        socket.on("connect_error", (err) => {
            console.warn("Socket connect_error", err);
        });

        socket.on("disconnect", (reason) => {
            console.log("Socket disconnected", reason);
        });
    }
    return socket;
};

export default getSocket;
