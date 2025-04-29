// filepath: c:\Users\jlim0\waterq\print-service\uninstall-service.js
const { Service } = require("node-windows");
const path = require("path");

const svc = new Service({
  name: "WaterQ Print Service",
  script: path.join(__dirname, "server.js"),
});

svc.on("uninstall", () => {
  console.log("Service uninstalled successfully");
});

console.log(
  "Uninstalling WaterQ Print Service..."
);
svc.uninstall();
