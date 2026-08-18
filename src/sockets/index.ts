import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

interface AuthedSocket extends Socket {
  userId?: string;
}

let ioInstance: Server | null = null;

export const getIO = (): Server | null => ioInstance;

export const initSocket = (httpServer: HttpServer): Server => {
  const io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
  });

  // Authenticate every socket connection using the JWT access token
  io.use((socket: AuthedSocket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "");

      if (!token) {
        return next(new Error("Authentication token missing"));
      }

      const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as { sub: string };
      socket.userId = payload.sub;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket: AuthedSocket) => {
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
