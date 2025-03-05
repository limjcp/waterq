import { Server } from "socket.io";

// Global type augmentation for TypeScript
declare global {
  var _socketIOServer: Server | undefined;
}

// Create or reuse a singleton Socket.IO server
export const getSocketIO = () => {
  if (!global._socketIOServer) {
    global._socketIOServer = new Server({
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });
    console.log("Created new Socket.IO server instance");
  }
  return global._socketIOServer;
};
