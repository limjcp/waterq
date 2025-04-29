const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const SERVER_PATH = path.join(
  __dirname,
  "server.js"
);
const LOG_PATH = path.join(__dirname, "logs");
const RESTART_DELAY = 5000; // 5 seconds

// Ensure log directory exists
if (!fs.existsSync(LOG_PATH)) {
  fs.mkdirSync(LOG_PATH, { recursive: true });
}

// Create log streams
const stdout = fs.createWriteStream(
  path.join(LOG_PATH, "print-service-out.log"),
  { flags: "a" }
);
const stderr = fs.createWriteStream(
  path.join(LOG_PATH, "print-service-err.log"),
  { flags: "a" }
);

function startServer() {
  console.log(
    `Starting print service at ${new Date().toISOString()}`
  );

  const server = spawn("node", [SERVER_PATH], {
    detached: false,
    stdio: ["ignore", "pipe", "pipe"],
  });

  // Pipe output to log files
  server.stdout.pipe(stdout);
  server.stderr.pipe(stderr);

  // Monitor the process
  server.on("exit", (code, signal) => {
    const exitMessage = `Print service exited with code ${code} and signal ${signal} at ${new Date().toISOString()}`;
    console.log(exitMessage);
    stderr.write(`${exitMessage}\n`);

    // Restart after delay
    setTimeout(startServer, RESTART_DELAY);
  });

  return server;
}

// Start the server
startServer();

console.log(
  `Watchdog started at ${new Date().toISOString()}`
);
