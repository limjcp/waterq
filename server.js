// First, run the update-env script to update environment variables with host IP
require("./update-env");

const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");
const os = require("os");

// Function to get local IP address
const getLocalIpAddress = () => {
  // First check if HOST_IP environment variable is set
  if (process.env.HOST_IP) {
    return process.env.HOST_IP;
  }

  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip over non-IPv4 and internal (loopback) addresses
      if (
        iface.family === "IPv4" &&
        !iface.internal
      ) {
        return iface.address;
      }
    }
  }
  return "0.0.0.0"; // Fallback if no suitable interface found
};

const dev = process.env.NODE_ENV !== "production";
// Get the public hostname for URLs
const publicHostname = getLocalIpAddress();
// Use 0.0.0.0 for binding (listen on all network interfaces)
const listenHostname = "0.0.0.0";
const port = 3000;

// Dynamically set auth URLs based on environment
let baseUrl;
if (process.env.VERCEL === "1") {
  // When running on Vercel
  baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://waterq.vercel.app";
} else {
  // When running locally
  baseUrl = `http://${publicHostname}:${port}`;
}

process.env.AUTH_URL = baseUrl;
process.env.NEXTAUTH_URL = baseUrl;

// Initialize Next.js
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create HTTP server
  const server = createServer(
    async (req, res) => {
      try {
        const parsedUrl = parse(req.url, true);
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error(
          "Error occurred handling",
          req.url,
          err
        );
        res.statusCode = 500;
        res.end("Internal Server Error");
      }
    }
  );

  // Initialize Socket.IO with the same server
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Make io available globally
  global.io = io;

  // Add more specific event handlers for your queueing system
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Let clients join rooms for specific counters
    socket.on("joinCounter", (counterId) => {
      // Leave any previous counter rooms
      socket.rooms.forEach((room) => {
        if (room.startsWith("counter:")) {
          socket.leave(room);
        }
      });

      // Join new counter room
      socket.join(`counter:${counterId}`);
      console.log(
        `Client ${socket.id} joined counter ${counterId}`
      );
    });

    // Handle ticket updates with full data payload
    socket.on("updateTicket", (ticketData) => {
      // Broadcast to all clients
      io.emit("ticket:update", ticketData);

      // If ticket is assigned to a counter, send specific update
      if (ticketData.counterId) {
        io.to(
          `counter:${ticketData.counterId}`
        ).emit("counter:ticket", ticketData);
      }
    });

    // Handle stats updates with full data payload
    socket.on("updateStats", (statsData) => {
      io.emit("stats:update", statsData);
    });

    socket.on("disconnect", () => {
      console.log(
        "Client disconnected:",
        socket.id
      );
    });

    // Handle errors
    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });
  });

  // Start the server - LISTEN ON ALL INTERFACES (0.0.0.0)
  server.listen(port, listenHostname, (err) => {
    if (err) throw err;
    console.log(
      `> Server listening on ${listenHostname}:${port}`
    );
    console.log(
      `> Public URL: http://${publicHostname}:${port}`
    );
    console.log(
      `> AUTH_URL set to: ${process.env.AUTH_URL}`
    );
    console.log(
      `> NEXTAUTH_URL set to: ${process.env.NEXTAUTH_URL}`
    );
    console.log("> Socket.IO server initialized");
  });
});
