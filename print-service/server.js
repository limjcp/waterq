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

// Print endpoint
app.post("/print", async (req, res) => {
  try {
    const { ticketNumber, timestamp, counterName, isPrioritized } = req.body;

    // Create a PDF with PDFKit
    const pdfPath = path.join(__dirname, "ticket.pdf");
    const doc = new PDFDocument({ size: [227, 145] }); // 80mm × 51mm thermal receipt size

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

    // Print with default printer or specified printer
    const options = {
      printer: process.env.DEFAULT_PRINTER || undefined, // Use environment variable or default
      silent: true,
    };

    await print(pdfPath, options);
    console.log(`Printed ticket: ${ticketNumber}`);

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Print error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get current default printer
app.get("/default-printer", (req, res) => {
  res.json({ printer: process.env.DEFAULT_PRINTER || "System Default" });
});

// Set default printer
app.post("/default-printer", (req, res) => {
  const { printer } = req.body;
  process.env.DEFAULT_PRINTER = printer;
  res.json({ success: true, printer });
});

app.listen(PORT, "127.0.0.1", () => {
  console.log(`Print service running on http://localhost:${PORT}`);
});
