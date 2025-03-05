import { NextRequest } from "next/server";
import { Server as NetServer } from "http";
import { Server as SocketIOServer } from "socket.io";

// This is a workaround for Next.js App Router to initialize Socket.IO
// More traditional approach is to use pages/api
export const dynamic = "force-dynamic";
export const GET = async (req: NextRequest) => {
  try {
    // @ts-ignore - we'll handle the socket initialization externally
    const res: any = new Response("Socket initialized");

    // Initialize Socket.IO
    const socketServer = res.socket?.server;
    if (!socketServer.io) {
      console.log("Initializing Socket.IO server...");
      socketServer.io = new SocketIOServer(socketServer);
    }

    return new Response("Socket.IO initialized", { status: 200 });
  } catch (error) {
    console.error("Error initializing socket:", error);
    return new Response("Failed to initialize socket", { status: 500 });
  }
};
