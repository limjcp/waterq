const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = 3000;

// Initialize Next.js
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Create HTTP server
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  });

  // Initialize Socket.IO with the same server
  const io = new Server(server);

  // Make io available globally
  global.io = io;

  // Add more specific event handlers for your queueing system
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    // Let clients join rooms for specific counters
    socket.on("joinCounter", (counterId) => {
      socket.join(`counter:${counterId}`);
      console.log(`Client ${socket.id} joined counter ${counterId}`);
    });

    // Handle ticket updates
    socket.on("updateTicket", (ticketData) => {
      // Broadcast to all clients
      io.emit("ticket:update", ticketData);

      // If ticket is assigned to a counter, send to that counter's room
      if (ticketData.counterId) {
        io.to(`counter:${ticketData.counterId}`).emit(
          "counter:ticket",
          ticketData
        );
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  // Start the server
  server.listen(port, hostname, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(
      "> To access from other devices, use your computer's IP address"
    );
    console.log(`> For example: http://<your-ip-address>:${port}`);
    console.log("> Socket.IO server initialized");
  });
});
