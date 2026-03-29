import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

const createIOConnection = () => {
    if (!socket || socket === undefined) {
        console.log('socket didnt exist');
        socket = io("http://10.0.2.2:3000/");
        // socket = io("http://localhost:3000", {
        //     transports: ["websocket"],
        //     autoConnect: false,
        // });
        // socket.connect();
    }
    console.log(socket.id);
    return socket;
};

export default createIOConnection;