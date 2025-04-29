// Configuration file for print service
module.exports = {
  // Print service options
  port: process.env.PRINT_SERVICE_PORT || 3030,

  // Security options
  allowedOrigins: [
    "http://localhost:3000",
    "http://192.168.50.240:3000",
    // Add your production URLs here
  ],

  // Default printer settings
  defaultPrinter:
    process.env.DEFAULT_PRINTER || "",

  // Paper sizes in points (1/72 inch)
  paperSizes: {
    thermal: [227, 145], // 80mm × 51mm
    a4: [595.28, 841.89],
    letter: [612, 792],
    receipt: [226.8, 595.28], // 80mm x 210mm
  },

  // Print retry options
  maxRetries: 3,
  retryDelay: 1000, // ms

  // Temporary file options
  tempDir: null, // null = use system temp dir
  cleanupDelay: 5000, // ms

  // Platform specific print commands
  commands: {
    win32: {
      sumatra: true, // Use SumatraPDF for enhanced silent printing
      sumatraPath:
        "%ProgramFiles%\\SumatraPDF\\SumatraPDF.exe",
    },
  },
};
