const Service = require("node-windows").Service;
const path = require("path");

// Create a new service object
const svc = new Service({
  name: "ClientPrintAgent",
  description: "Node.js Client Print Agent",
  script: path.join(__dirname, "index.js"),
});

// Listen for the "install" event, which indicates the service has been installed
svc.on("install", () => {
  svc.start();
  console.log("Service installed and started successfully.");
});

// Install the service
svc.install();
svc.uninstall();
