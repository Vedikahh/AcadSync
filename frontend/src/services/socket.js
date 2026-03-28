import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const socket = io(SOCKET_URL, {
    autoConnect: true,
    reconnection: true,
    auth: (cb) => {
        const token = localStorage.getItem("acadsync_token");
        cb({ token });
    }
});

export default socket;
