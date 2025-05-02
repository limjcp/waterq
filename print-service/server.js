const express = require("express");
const cors = require("cors");
const {
  print,
  getPrinters,
} = require("pdf-to-printer");
const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const { exec } = require("child_process");
const os = require("os");

const app = express();
const PORT = 3030;

// Configure CORS to only allow requests from your kiosk
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://192.168.50.240:3000",
    ], // Add your kiosk IP/hostname
  })
);

app.use(express.json());

// Determine OS for platform-specific printing options
const platform = os.platform();
console.log(`Running on ${platform} platform`);

// Get list of available printers
app.get("/printers", async (req, res) => {
  try {
    const printers = await getPrinters();
    res.json(printers);
  } catch (error) {
    console.error(
      "Error getting printers:",
      error
    );
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Default print settings
const DEFAULT_PRINT_SETTINGS = {
  printer: "",
  orientation: "portrait",
  paperSize: "thermal", // 80mm × 51mm thermal receipt
  copies: 1,
  scale: "noscale",
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
  printSettings = {
    ...printSettings,
    ...newSettings,
  };

  // Update environment variable for backward compatibility
  process.env.DEFAULT_PRINTER =
    printSettings.printer;

  res.json({
    success: true,
    settings: printSettings,
  });
});

// Function to print using platform-specific commands (fallback)
async function printWithNativeCommands(
  pdfPath,
  printerName
) {
  return new Promise((resolve, reject) => {
    let command;

    if (platform === "win32") {
      // Windows - use built-in printing system
      if (printerName) {
        // Use the specified printer
        command = `powershell -Command "& {$printerName = '${printerName}'; Get-Printer | Where-Object Name -eq $printerName | ForEach-Object { Start-Process -FilePath '${pdfPath}' -Verb Print }}"`;
      } else {
        // Use the default printer
        command = `powershell -Command "Start-Process -FilePath '${pdfPath}' -Verb Print"`;
      }
    } else if (platform === "darwin") {
      // macOS
      command = `lpr ${
        printerName ? `-P "${printerName}"` : ""
      } -o raw "${pdfPath}"`;
    } else {
      // Linux
      command = `lp ${
        printerName ? `-d "${printerName}"` : ""
      } -o raw "${pdfPath}"`;
    }

    console.log(
      `Executing native print command: ${command}`
    );

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(
          `Native print command error: ${error.message}`
        );
        console.error(`stderr: ${stderr}`);
        reject(error);
        return;
      }
      console.log(
        `Native print command stdout: ${stdout}`
      );
      resolve();
    });
  });
}

// Create a unique file path for each print job
function createUniquePdfPath() {
  const timestamp = Date.now();
  const random = Math.floor(
    Math.random() * 10000
  );
  return path.join(
    os.tmpdir(),
    `ticket_${timestamp}_${random}.pdf`
  );
}

// Enhanced print endpoint with fallback mechanisms
app.post("/print", async (req, res) => {
  let pdfPath = null;

  try {
    const {
      ticketNumber,
      timestamp,
      counterName,
      isPrioritized,
    } = req.body;

    // Create a PDF with PDFKit
    pdfPath = createUniquePdfPath();

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
          printSettings.orientation === "portrait"
            ? [612, 792]
            : [792, 612];
        break;
      case "thermal":
      default:
        docSize = [227, 145]; // Default thermal receipt size (~ 3 x 2 inches)
        break;
    }

    const doc = new PDFDocument({
      size: docSize,
      layout: printSettings.orientation,
      margin: 10, // Small margins for thermal receipts
    });

    const writeStream =
      fs.createWriteStream(pdfPath);
    doc.pipe(writeStream);

    // Format the ticket
    doc.font("Courier-Bold").fontSize(36);
    doc.text(ticketNumber, { align: "center" });

    doc.moveDown(0.5);
    doc.font("Courier").fontSize(14);
    doc.text(
      timestamp || new Date().toLocaleString(),
      { align: "center" }
    );

    if (counterName) {
      doc.moveDown(0.5);
      doc.fontSize(12);
      doc.text(`Counter: ${counterName}`, {
        align: "center",
      });
    }

    // Finalize PDF
    doc.end();

    // Wait for PDF to be fully written to disk
    await new Promise((resolve, reject) => {
      writeStream.on("finish", resolve);
      writeStream.on("error", reject);
    });

    console.log(`PDF created at: ${pdfPath}`);

    // Enhanced print options
    const options = {
      printer: printSettings.printer || undefined,
      silent: true, // This is key for silent printing
      scale: printSettings.scale,
      copies: printSettings.copies,
      orientation: printSettings.orientation,
      // Platform specific options
      win32: ['-print-settings "fit"'],
    };
    try {
      // First try with pdf-to-printer
      await print(pdfPath, options);
      console.log(
        `Printed ticket: ${ticketNumber} with pdf-to-printer`
      );
    } catch (pdfPrinterError) {
      console.error(
        "pdf-to-printer failed, trying native commands:",
        pdfPrinterError
      );

      try {
        // Fallback to native printing commands
        await printWithNativeCommands(
          pdfPath,
          printSettings.printer
        );
        console.log(
          `Printed ticket: ${ticketNumber} with native commands`
        );
      } catch (nativeError) {
        console.error(
          "Native printing failed:",
          nativeError
        );

        // Create a more user-friendly error message
        const errorMsg =
          "Failed to print. Please check your printer connection and settings.";
        throw new Error(errorMsg);
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Print error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  } finally {
    // Clean up the PDF file after a delay to ensure printing completes
    if (pdfPath) {
      setTimeout(() => {
        try {
          fs.unlinkSync(pdfPath);
          console.log(
            `Removed temporary PDF: ${pdfPath}`
          );
        } catch (err) {
          console.error(
            `Failed to remove temporary PDF: ${err.message}`
          );
        }
      }, 5000);
    }
  }
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", platform });
});

// For backward compatibility
app.get("/default-printer", (req, res) => {
  res.json({
    printer:
      printSettings.printer || "System Default",
  });
});

app.post("/default-printer", (req, res) => {
  const { printer } = req.body;
  printSettings.printer = printer;
  process.env.DEFAULT_PRINTER = printer;
  res.json({ success: true, printer });
});

// Start the server with more robust error handling
app
  .listen(PORT, "0.0.0.0", () => {
    console.log(
      `Print service running on http://0.0.0.0:${PORT}`
    );
    console.log(
      `Print settings: ${JSON.stringify(
        printSettings
      )}`
    );
  })
  .on("error", (error) => {
    console.error(
      `Failed to start print service: ${error.message}`
    );
    if (error.code === "EADDRINUSE") {
      console.error(
        `Port ${PORT} is already in use. Is another instance running?`
      );
    }
  });
