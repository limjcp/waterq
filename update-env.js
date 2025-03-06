const fs = require("fs");
const os = require("os");
const path = require("path");

// Get local IP address
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip over non-IPv4 and internal (loopback) addresses
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "127.0.0.1"; // Fallback to localhost if no suitable interface found
}

// Update .env file with actual IP address
function updateEnvFile() {
  const envPath = path.join(__dirname, ".env");
  const ip = getLocalIpAddress();

  console.log(`Updating environment variables with IP: ${ip}`);

  try {
    // Read the .env file
    let envContent = fs.readFileSync(envPath, "utf8");

    // Replace AUTO_IP with actual IP address
    envContent = envContent.replace(/AUTO_IP/g, ip);

    // Write the updated content back to the .env file
    fs.writeFileSync(envPath, envContent, "utf8");

    console.log("Environment variables updated successfully");
  } catch (error) {
    console.error("Error updating environment variables:", error);
  }
}

// Run the update
updateEnvFile();
