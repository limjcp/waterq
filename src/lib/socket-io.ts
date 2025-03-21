// This file provides a way for API routes to emit Socket.IO events
import { Server as SocketIOServer } from "socket.io";
import { Server as NetServer } from "http";

export type NextApiResponseWithSocket = {
  socket: {
    server: NetServer & {
      io?: SocketIOServer;
    };
  };
};

// Function to emit a Socket.IO event from an API route
export function emitSocketEvent(
  event: string,
  data: any,
  room?: string
): boolean {
  try {
    const io = getIO();

    if (!io) {
      console.warn("Socket.IO server not found. Event not emitted.");
      return false;
    }

    // Clone the data to ensure we don't mutate the original
    const payload = { ...data };

    if (room) {
      // Emit to specific room
      io.to(room).emit(event, payload);
      console.log(
        `Emitted Socket.IO event: ${event} to room: ${room}`,
        payload
      );
    } else {
      // Broadcast to all clients
      io.emit(event, payload);
      console.log(`Emitted Socket.IO event: ${event} to all clients`, payload);
    }

    return true;
  } catch (error) {
    console.error("Error emitting Socket.IO event:", error);
    return false;
  }
}

// This is a utility to access the Socket.IO server from API routes
import { Server as IOServer } from "socket.io";
import http from "http";

// Add global type definition
declare global {
  var io: IOServer | undefined;
}

// Get the global Socket.IO instance
export function getIO(): IOServer | undefined {
  return global.io;
}

// Set the global Socket.IO instance (called from server.js)
export function setIO(ioInstance: IOServer): void {
  global.io = ioInstance;
}

// Use Node's global to store the Socket.IO instance across API routes
export function getSocketIo(server?: http.Server): IOServer {
  if (!global.socketIo && server) {
    global.socketIo = new IOServer(server);
    console.log("Socket.IO server initialized");
  }

  if (!global.socketIo) {
    throw new Error(
      "Socket.IO not initialized. Make sure you call getSocketIo with a server instance first."
    );
  }

  return global.socketIo;
}

// Add specific event emitters for more type safety
export function emitTicketUpdate(ticketData: any): boolean {
  return emitSocketEvent("ticket:update", ticketData);
}

export function emitCounterUpdate(counterId: string, ticketData: any): boolean {
  return emitSocketEvent("counter:ticket", ticketData, `counter:${counterId}`);
}

export function emitStatsUpdate(statsData: any): boolean {
  return emitSocketEvent("stats:update", statsData);
}
