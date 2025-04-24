const express = require("express");
const cors = require("cors");
const { print, getPrinters } = require("pdf-to-printer");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");

const app = express();
const PORT = 3030;

// Configure CORS to only allow requests from your kiosk
app.use(
  cors({
    origin: ["http://localhost:3000", "http://192.168.50.240:3000"], // Add your kiosk IP/hostname
  })
);

app.use(express.json());

// Get list of available printers
app.get("/printers", async (req, res) => {
  try {
    const printers = await getPrinters();
    res.json(printers);
  } catch (error) {
    console.error("Error getting printers:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Default print settings
const DEFAULT_PRINT_SETTINGS = {
  printer: "",
  orientation: "portrait",
  paperSize: "thermal", // 80mm × 51mm thermal receipt
  copies: 1,
  scale: 100,
  fit: true,
};

// Global settings object
let printSettings = {
  ...DEFAULT_PRINT_SETTINGS,
  printer: process.env.DEFAULT_PRINTER || "",
};

// Get all print settings
app.get("/print-settings", (req, res) => {
  res.json(printSettings);
});

// Update print settings
app.post("/print-settings", (req, res) => {
  const newSettings = req.body;
  printSettings = { ...printSettings, ...newSettings };

  // Update environment variable for backward compatibility
  process.env.DEFAULT_PRINTER = printSettings.printer;

  res.json({ success: true, settings: printSettings });
});

// Modify the print endpoint to use the settings
app.post("/print", async (req, res) => {
  try {
    const { ticketNumber, timestamp, counterName, isPrioritized } = req.body;

    // Create a PDF with PDFKit
    const pdfPath = path.join(__dirname, "ticket.pdf");

    // Set document size based on paper size setting
    let docSize;
    switch (printSettings.paperSize) {
      case "a4":
        docSize =
          printSettings.orientation === "portrait"
            ? [595.28, 841.89]
            : [841.89, 595.28];
        break;
      case "letter":
        docSize =
          printSettings.orientation === "portrait" ? [612, 792] : [792, 612];
        break;
      case "thermal":
      default:
        docSize = [227, 145]; // Default thermal receipt size
        break;
    }

    const doc = new PDFDocument({
      size: docSize,
      layout: printSettings.orientation,
    });

    doc.pipe(fs.createWriteStream(pdfPath));

    // Format the ticket
    doc.font("Courier-Bold").fontSize(36);
    doc.text(ticketNumber, { align: "center" });

    doc.moveDown(0.5);
    doc.font("Courier").fontSize(14);
    doc.text(timestamp, { align: "center" });

    if (counterName) {
      doc.moveDown(0.5);
      doc.fontSize(12);
      doc.text(`Counter: ${counterName}`, { align: "center" });
    }

    // Finalize PDF
    doc.end();

    // Wait for PDF to be created
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Update print options to include the settings
    const options = {
      printer: printSettings.printer || undefined,
      silent: true,
      scale: printSettings.scale,
      copies: printSettings.copies,
      orientation: printSettings.orientation,
    };

    await print(pdfPath, options);
    console.log(
      `Printed ticket: ${ticketNumber} with settings:`,
      printSettings
    );

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Print error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// For backward compatibility
app.get("/default-printer", (req, res) => {
  res.json({ printer: printSettings.printer || "System Default" });
});

app.post("/default-printer", (req, res) => {
  const { printer } = req.body;
  printSettings.printer = printer;
  process.env.DEFAULT_PRINTER = printer;
  res.json({ success: true, printer });
});

app.listen(PORT, "127.0.0.1", () => {
  console.log(`Print service running on http://localhost:${PORT}`);
});
