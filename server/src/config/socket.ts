import { Server } from "socket.io";

let io: Server;

export const setIO = (socketServer: Server) => {
  io = socketServer;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }

  return io;
};