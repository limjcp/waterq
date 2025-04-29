const { Service } = require("node-windows");
const path = require("path");

// Create a new Windows service object
const svc = new Service({
  name: "WaterQ Print Service",
  description:
    "Local print service for WaterQ kiosk application",
  script: path.join(__dirname, "server.js"),
  // Run the service as the currently logged in user instead of LocalSystem
  // This ensures access to user's printer configuration
  allowServiceLogon: true,
  // Add environment variables
  env: [
    {
      name: "DEFAULT_PRINTER",
      value: "", // Leave empty to use system default printer
    },
    {
      name: "NODE_ENV",
      value: "production",
    },
  ],
});

// Listen for events
svc.on("install", () => {
  console.log("Service installed successfully");
  svc.start();
});

svc.on("start", () => {
  console.log("Service started successfully");
  console.log(
    "You can now use the print service at http://localhost:3030"
  );
});

svc.on("error", (err) => {
  console.error("Service error:", err);
});

// Install the service
console.log("Installing WaterQ Print Service...");
svc.install();
