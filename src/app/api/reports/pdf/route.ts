import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import jsPDF from "jspdf";
import fs from "fs";
import path from "path";

type ServiceDay = {
  date: string;
  count: number;
};

type ServiceType = {
  typeName: string;
  count: number;
};

type ServiceBreakdown = {
  serviceName: string;
  types: ServiceType[];
};

type TicketDetail = {
  prefix: string;
  ticketNumber: string;
  serviceName: string;
  serviceTypeName: string;
  dateTime: string;
  serviceTime: number;
};

type ReportData = {
  name: string;
  ticketsServed: number;
  averageServiceTime: number;
  serviceByDay: ServiceDay[];
  serviceTypesBreakdown: ServiceBreakdown[];
  ticketDetails?: TicketDetail[];
};

// Format time (seconds) as MM:SS
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

// Function to generate filename based on filters
const generateFileName = (
  reportMode: string,
  name: string,
  startDate: string,
  endDate: string
): string => {
  const today = new Date().toISOString().split("T")[0];
  const sanitizedName = name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  return `gscwd_${reportMode}_${sanitizedName}_${startDate}_to_${endDate}_generated_${today}.pdf`;
};

export async function POST(request: NextRequest) {
  // Check authentication
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { reportData, startDate, endDate, reportMode } =
      (await request.json()) as {
        reportData: ReportData;
        startDate: string;
        endDate: string;
        reportMode: "staff" | "service";
      };

    // Create a new PDF document
    const doc = new jsPDF();

    // Read and encode the logo
    const logoPath = path.join(process.cwd(), "public", "wdlogo.png");
    const logoBuffer = fs.readFileSync(logoPath);
    const logoBase64 = Buffer.from(logoBuffer).toString("base64");

    // Set initial y position
    let y = 20;

    // Add logo
    doc.addImage(
      `data:image/png;base64,${logoBase64}`,
      "PNG",
      doc.internal.pageSize.width / 2 - 20, // Center the 40x40 logo
      y,
      40,
      40
    );
    y += 45; // Move down past the logo

    // Header
    doc.setFontSize(24);
    doc.text(
      "General Santos City Water District",
      doc.internal.pageSize.width / 2,
      y,
      { align: "center" }
    );
    y += 10;

    doc.setFontSize(18);
    doc.text(
      reportMode === "staff" ? "Staff Performance Report" : "Service Report",
      doc.internal.pageSize.width / 2,
      y,
      { align: "center" }
    );
    y += 15;

    // Report info
    doc.setFontSize(12);
    doc.text(`Report for: ${reportData.name}`, 20, y);
    y += 7;
    doc.text(`Period: ${startDate} to ${endDate}`, 20, y);
    y += 15;

    // Summary statistics
    doc.setFontSize(16);
    doc.text("Summary Statistics", 20, y);
    y += 10;
    doc.setFontSize(12);
    doc.text(`Total Tickets Served: ${reportData.ticketsServed}`, 20, y);
    y += 7;
    doc.text(
      `Average Service Time: ${formatTime(reportData.averageServiceTime)}`,
      20,
      y
    );
    y += 15;

    // Daily breakdown
    doc.setFontSize(16);
    doc.text("Daily Performance", 20, y);
    y += 10;

    // Table headers
    doc.setFontSize(12);
    doc.text("Date", 20, y);
    doc.text("Tickets", 100, y);
    y += 7;

    // Draw header line
    doc.line(20, y, 180, y);
    y += 5;

    // Table rows
    doc.setFontSize(10);
    reportData.serviceByDay.forEach((day) => {
      if (y > 270) {
        // Check if we need a new page
        doc.addPage();
        y = 20;
      }
      doc.text(day.date, 20, y);
      doc.text(day.count.toString(), 100, y);
      y += 7;
    });

    // Service Type Breakdown
    doc.addPage();
    y = 20;
    doc.setFontSize(16);
    doc.text("Service Type Breakdown", 20, y);
    y += 15;

    reportData.serviceTypesBreakdown.forEach((service) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(14);
      doc.text(service.serviceName, 20, y);
      y += 10;

      // Table headers
      doc.setFontSize(12);
      doc.text("Service Type", 20, y);
      doc.text("Tickets Served", 100, y);
      y += 7;

      // Draw header line
      doc.line(20, y, 180, y);
      y += 5;

      // Table rows
      doc.setFontSize(10);
      service.types.forEach((type) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        doc.text(type.typeName, 20, y);
        doc.text(type.count.toString(), 100, y);
        y += 7;
      });
      y += 10;
    });

    // Detailed Ticket Information
    if (reportData.ticketDetails && reportData.ticketDetails.length > 0) {
      doc.addPage();
      y = 20;
      doc.setFontSize(16);
      doc.text(
        "Detailed Ticket Information",
        doc.internal.pageSize.width / 2,
        y,
        { align: "center" }
      );
      y += 15;

      // Table headers
      doc.setFontSize(10);
      doc.text("Ticket #", 20, y);
      doc.text("Service", 60, y);
      doc.text("Service Type", 100, y);
      doc.text("Date & Time", 140, y);
      doc.text("Service Time", 180, y);
      y += 7;

      // Draw header line
      doc.line(20, y, 190, y);
      y += 5;

      // Process tickets
      const MAX_TICKETS = 500; // Limit for performance
      const ticketsToProcess = reportData.ticketDetails.slice(0, MAX_TICKETS);

      ticketsToProcess.forEach((ticket) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
          // Repeat headers on new page
          doc.setFontSize(10);
          doc.text("Ticket #", 20, y);
          doc.text("Service", 60, y);
          doc.text("Service Type", 100, y);
          doc.text("Date & Time", 140, y);
          doc.text("Service Time", 180, y);
          y += 7;
          doc.line(20, y, 190, y);
          y += 5;
        }

        doc.setFontSize(8);
        doc.text(`${ticket.prefix}-${ticket.ticketNumber}`, 20, y);
        doc.text(ticket.serviceName.substring(0, 15), 60, y);
        doc.text(ticket.serviceTypeName.substring(0, 15), 100, y);
        doc.text(ticket.dateTime.substring(0, 16), 140, y);
        doc.text(formatTime(ticket.serviceTime), 180, y);
        y += 7;
      });

      if (reportData.ticketDetails.length > MAX_TICKETS) {
        y += 10;
        doc.setFontSize(10);
        doc.text(
          `Note: Only showing first ${MAX_TICKETS} out of ${reportData.ticketDetails.length} tickets for performance reasons.`,
          20,
          y
        );
      }
    }

    // Convert PDF to buffer
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

    // Generate filename based on filters
    const filename = generateFileName(
      reportMode,
      reportData.name,
      startDate,
      endDate
    );

    // Return the PDF as response with the new filename
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error generating PDF report:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
