import { io, Socket } from "socket.io-client";
import { Platform } from "react-native";

let socket: Socket | null = null;

const BACKEND_URL = Platform.OS === 'android' 
? 'http://10.0.2.2:3000' 
: 'http://localhost:3000';

const getSocket = () => {
    if (!socket) {
        socket = io(BACKEND_URL, {
            transports: ["websocket", "polling"],
            autoConnect: true,
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