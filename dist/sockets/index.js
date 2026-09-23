"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initSocket = exports.getIO = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
let ioInstance = null;
const getIO = () => ioInstance;
exports.getIO = getIO;
const initSocket = (httpServer) => {
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: env_1.env.CLIENT_URL,
            credentials: true,
        },
    });
    // Authenticate every socket connection using the JWT access token
    io.use((socket, next) => {
        try {
            const token = socket.handshake.auth?.token ||
                socket.handshake.headers?.authorization?.replace("Bearer ", "");
            if (!token) {
                return next(new Error("Authentication token missing"));
            }
            const payload = jsonwebtoken_1.default.verify(token, env_1.env.JWT_ACCESS_SECRET);
            socket.userId = payload.sub;
            next();
        }
        catch {
            next(new Error("Invalid or expired token"));
        }
    });
    io.on("connection", (socket) => {
        if (socket.userId) {
            // Each user joins a private room keyed by their own id —
            // notifications are emitted to io.to(userId) rather than broadcast.
            socket.join(socket.userId);
        }
        socket.on("disconnect", () => {
            // Room membership is cleaned up automatically by Socket.io on disconnect.
        });
    });
    ioInstance = io;
    return io;
};
exports.initSocket = initSocket;
//# sourceMappingURL=index.js.map