import { io } from "socket.io-client";

const socket = io("http://localhost:5004", {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});

export default socket; 