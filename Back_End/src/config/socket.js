import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: [
                process.env.FRONTEND_URL,
                "http://localhost:3000",
                "http://127.0.0.1:3000",
                "http://192.168.137.1:3000",
            ],
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    io.on("connection", (socket) => {
        console.log("New client connected:", socket.id);

        socket.on("join", (userId) => {
            if (userId) {
                socket.join(`user_${userId}`);
                console.log(`User ${userId} joined their private room`);
            }
        });

        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.id);
        });
    });

    return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error("Socket.io not initialized!");
    }
    return io;
};

export const emitToUser = (userId, event, data) => {
    if (io) {
        io.to(`user_${userId}`).emit(event, data);
    }
};
