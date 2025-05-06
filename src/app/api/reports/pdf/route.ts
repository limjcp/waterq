import {
  NextRequest,
  NextResponse,
} from "next/server";
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
  servingStart: string;
  servingEnd: string;
  serviceTime: number;
  remarks?: string; // Add remarks field
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
  const remainingSeconds = Math.round(
    seconds % 60
  );
  return `${minutes}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
};

// Function to format datetime to show AM/PM
const formatDateTime = (
  dateTimeStr: string
): string => {
  if (!dateTimeStr || dateTimeStr.length < 16)
    return dateTimeStr;

  // Extract date and time parts
  const datePart = dateTimeStr.substring(0, 10);
  const timePart = dateTimeStr.substring(11, 19); // Include seconds by getting 19 characters

  // Parse the time
  const [hours, minutes, seconds] = timePart
    .split(":")
    .map(Number);

  // Convert to 12-hour format with AM/PM
  const period = hours >= 12 ? "PM" : "AM";
  const formattedHours = hours % 12 || 12; // Convert 0 to 12

  return `${datePart} ${formattedHours}:${minutes
    .toString()
    .padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")} ${period}`;
};

// Function to generate filename based on filters
const generateFileName = (
  reportMode: string,
  name: string,
  startDate: string,
  endDate: string
): string => {
  const today = new Date()
    .toISOString()
    .split("T")[0];
  const sanitizedName = name
    .replace(/[^a-z0-9]/gi, "_")
    .toLowerCase();
  return `gscwd_${reportMode}_${sanitizedName}_${startDate}_to_${endDate}_generated_${today}.pdf`;
};

export async function POST(request: NextRequest) {
  // Check authentication
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const {
      reportData,
      startDate,
      endDate,
      reportMode,
    } = (await request.json()) as {
      reportData: ReportData;
      startDate: string;
      endDate: string;
      reportMode: "staff" | "service";
    };

    // Create a new PDF document
    const doc = new jsPDF();

    // Define colors for better design
    const primaryColor = [0, 92, 169]; // Dark blue
    const secondaryColor = [0, 147, 221]; // Light blue
    const accentColor = [0, 173, 131]; // Teal green
    const textColor = [51, 51, 51]; // Dark gray

    // Set initial y position
    let y = 20;
    const marginLeft = 20;

    // Read and encode the logo
    const logoPath = path.join(
      process.cwd(),
      "public",
      "wdlogo.png"
    );
    const logoBuffer = fs.readFileSync(logoPath);
    const logoBase64 =
      Buffer.from(logoBuffer).toString("base64");

    // Add logo at top left
    const logoSize = 30;
    doc.addImage(
      `data:image/png;base64,${logoBase64}`,
      "PNG",
      marginLeft,
      y,
      logoSize,
      logoSize
    );

    // Add company name to the right of the logo
    doc.setFontSize(20);
    doc.setTextColor(
      primaryColor[0],
      primaryColor[1],
      primaryColor[2]
    );
    doc.text(
      "General Santos City Water District",
      marginLeft + logoSize + 10,
      y + 12
    );

    // Add report title below with a different color
    doc.setFontSize(16);
    doc.setTextColor(
      secondaryColor[0],
      secondaryColor[1],
      secondaryColor[2]
    );
    doc.text(
      reportMode === "staff"
        ? "Staff Performance Report"
        : "Service Report",
      marginLeft + logoSize + 10,
      y + 22
    );

    // Add a horizontal line to separate header from content
    y += logoSize + 10;
    doc.setDrawColor(
      accentColor[0],
      accentColor[1],
      accentColor[2]
    );
    doc.setLineWidth(0.5);
    doc.line(
      marginLeft,
      y,
      doc.internal.pageSize.width - marginLeft,
      y
    );

    // Report info
    y += 15;
    doc.setFontSize(12);
    doc.setTextColor(
      textColor[0],
      textColor[1],
      textColor[2]
    );
    doc.text(
      `Report for: ${reportData.name}`,
      marginLeft,
      y
    );

    // Add the date range on the right side
    doc.text(
      `Period: ${startDate} to ${endDate}`,
      doc.internal.pageSize.width - marginLeft,
      y,
      { align: "right" }
    );

    // Summary statistics with a colored background rectangle
    y += 20;
    doc.setFillColor(245, 245, 245); // Light gray background
    doc.roundedRect(
      marginLeft,
      y,
      doc.internal.pageSize.width -
        marginLeft * 2,
      40,
      5,
      5,
      "F"
    );

    // Section title with accent color
    y += 15;
    doc.setFontSize(14);
    doc.setTextColor(
      primaryColor[0],
      primaryColor[1],
      primaryColor[2]
    );
    doc.text(
      "Summary Statistics",
      marginLeft + 10,
      y
    );

    // Summary data in two columns
    y += 15;
    doc.setFontSize(11);
    doc.setTextColor(
      textColor[0],
      textColor[1],
      textColor[2]
    );
    doc.text(
      `Total Tickets Served: ${reportData.ticketsServed}`,
      marginLeft + 10,
      y
    );
    doc.text(
      `Average Service Time: ${formatTime(
        reportData.averageServiceTime
      )}`,
      doc.internal.pageSize.width / 2 + 10,
      y
    );

    // Daily breakdown with better styling
    y += 25;
    doc.setFontSize(14);
    doc.setTextColor(
      primaryColor[0],
      primaryColor[1],
      primaryColor[2]
    );
    doc.text("Daily Performance", marginLeft, y);
    y += 10;

    // Table headers with background
    doc.setFillColor(
      secondaryColor[0],
      secondaryColor[1],
      secondaryColor[2]
    );
    doc.rect(marginLeft, y - 5, 160, 10, "F");

    // Table header text
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255); // White text for contrast
    doc.text("Date Range", marginLeft + 10, y);
    doc.text("Tickets", marginLeft + 120, y);
    y += 10;

    // Table rows with alternating colors
    doc.setTextColor(
      textColor[0],
      textColor[1],
      textColor[2]
    );
    doc.setFontSize(10);

    let rowCount = 0;
    reportData.serviceByDay.forEach((day) => {
      if (y > 270) {
        // Check if we need a new page
        doc.addPage();
        y = 20;

        // Repeat header on new page
        doc.setFillColor(
          secondaryColor[0],
          secondaryColor[1],
          secondaryColor[2]
        );
        doc.rect(marginLeft, y - 5, 160, 10, "F");
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.text(
          "Date Range",
          marginLeft + 10,
          y
        );
        doc.text("Tickets", marginLeft + 120, y);
        y += 10;
        doc.setTextColor(
          textColor[0],
          textColor[1],
          textColor[2]
        );
        rowCount = 0;
      }

      // Alternate row background for better readability
      if (rowCount % 2 === 0) {
        doc.setFillColor(245, 245, 245);
        doc.rect(marginLeft, y - 5, 160, 8, "F");
      }

      const [startDate, endDate] = day.date
        .split("to")
        .map((d) => d.trim());
      doc.text(
        `${startDate} - ${endDate}`,
        marginLeft + 10,
        y
      );
      doc.text(
        day.count.toString(),
        marginLeft + 120,
        y
      );
      y += 8;
      rowCount++;
    });

    // Service Type Breakdown
    doc.addPage();
    y = 20;

    // Add logo header to each page for consistent branding
    doc.addImage(
      `data:image/png;base64,${logoBase64}`,
      "PNG",
      marginLeft,
      y,
      20,
      20
    );

    doc.setFontSize(12);
    doc.setTextColor(
      primaryColor[0],
      primaryColor[1],
      primaryColor[2]
    );
    doc.text(
      "General Santos City Water District",
      marginLeft + 25,
      y + 7
    );
    doc.setDrawColor(
      accentColor[0],
      accentColor[1],
      accentColor[2]
    );
    doc.line(
      marginLeft,
      y + 25,
      doc.internal.pageSize.width - marginLeft,
      y + 25
    );

    y += 40;
    doc.setFontSize(16);
    doc.setTextColor(
      primaryColor[0],
      primaryColor[1],
      primaryColor[2]
    );
    doc.text(
      "Service Type Breakdown",
      marginLeft,
      y
    );
    y += 15;

    reportData.serviceTypesBreakdown.forEach(
      (service) => {
        if (y > 270) {
          doc.addPage();
          y = 20;

          // Add consistent header on new page
          doc.addImage(
            `data:image/png;base64,${logoBase64}`,
            "PNG",
            marginLeft,
            y,
            20,
            20
          );
          doc.setFontSize(12);
          doc.setTextColor(
            primaryColor[0],
            primaryColor[1],
            primaryColor[2]
          );
          doc.text(
            "General Santos City Water District",
            marginLeft + 25,
            y + 7
          );
          doc.setDrawColor(
            accentColor[0],
            accentColor[1],
            accentColor[2]
          );
          doc.line(
            marginLeft,
            y + 25,
            doc.internal.pageSize.width -
              marginLeft,
            y + 25
          );
          y += 40;
        }

        // Service name as header - simple styling without background
        doc.setFontSize(14);
        doc.setTextColor(
          primaryColor[0],
          primaryColor[1],
          primaryColor[2]
        );
        doc.text(
          service.serviceName,
          marginLeft,
          y
        );
        y += 15;

        // Table headers with background
        doc.setFillColor(
          secondaryColor[0],
          secondaryColor[1],
          secondaryColor[2]
        );
        doc.rect(marginLeft, y - 5, 160, 10, "F");

        // Table header text
        doc.setFontSize(11);
        doc.setTextColor(255, 255, 255);
        doc.text(
          "Service Type",
          marginLeft + 10,
          y
        );
        doc.text(
          "Tickets Served",
          marginLeft + 100,
          y
        );
        y += 10;

        // Table rows with alternating colors
        doc.setTextColor(
          textColor[0],
          textColor[1],
          textColor[2]
        );
        doc.setFontSize(10);

        let rowCount = 0;
        service.types.forEach((type) => {
          if (y > 270) {
            doc.addPage();
            y = 20;

            // Add consistent header on new page
            doc.addImage(
              `data:image/png;base64,${logoBase64}`,
              "PNG",
              marginLeft,
              y,
              20,
              20
            );
            doc.setFontSize(12);
            doc.setTextColor(
              primaryColor[0],
              primaryColor[1],
              primaryColor[2]
            );
            doc.text(
              "General Santos City Water District",
              marginLeft + 25,
              y + 7
            );
            doc.setDrawColor(
              accentColor[0],
              accentColor[1],
              accentColor[2]
            );
            doc.line(
              marginLeft,
              y + 25,
              doc.internal.pageSize.width -
                marginLeft,
              y + 25
            );
            y += 40;

            // Repeat service category on new page
            doc.setFontSize(14);
            doc.setTextColor(
              primaryColor[0],
              primaryColor[1],
              primaryColor[2]
            );
            doc.text(
              `${service.serviceName} (continued)`,
              marginLeft,
              y + 8
            );
            y += 25;

            // Repeat table headers on new page
            doc.setFillColor(
              secondaryColor[0],
              secondaryColor[1],
              secondaryColor[2]
            );
            doc.rect(
              marginLeft,
              y - 5,
              160,
              10,
              "F"
            );
            doc.setFontSize(11);
            doc.setTextColor(255, 255, 255);
            doc.text(
              "Service Type",
              marginLeft + 10,
              y
            );
            doc.text(
              "Tickets Served",
              marginLeft + 100,
              y
            );
            y += 10;

            doc.setTextColor(
              textColor[0],
              textColor[1],
              textColor[2]
            );
            doc.setFontSize(10);
            rowCount = 0;
          }

          // Alternate row background for better readability
          if (rowCount % 2 === 0) {
            doc.setFillColor(245, 245, 245);
            doc.rect(
              marginLeft,
              y - 5,
              160,
              8,
              "F"
            );
          }

          doc.text(
            type.typeName,
            marginLeft + 10,
            y
          );
          doc.text(
            type.count.toString(),
            marginLeft + 100,
            y
          );
          y += 8;
          rowCount++;
        });
        y += 15;
      }
    );

    // Detailed Ticket Information
    if (
      reportData.ticketDetails &&
      reportData.ticketDetails.length > 0
    ) {
      doc.addPage();
      y = 20;

      // Add consistent header on the detailed ticket page
      doc.addImage(
        `data:image/png;base64,${logoBase64}`,
        "PNG",
        marginLeft,
        y,
        20,
        20
      );
      doc.setFontSize(12);
      doc.setTextColor(
        primaryColor[0],
        primaryColor[1],
        primaryColor[2]
      );
      doc.text(
        "General Santos City Water District",
        marginLeft + 25,
        y + 7
      );
      doc.setDrawColor(
        accentColor[0],
        accentColor[1],
        accentColor[2]
      );
      doc.line(
        marginLeft,
        y + 25,
        doc.internal.pageSize.width - marginLeft,
        y + 25
      );
      y += 40;

      // Section title
      doc.setFontSize(16);
      doc.setTextColor(
        primaryColor[0],
        primaryColor[1],
        primaryColor[2]
      );
      doc.text(
        "Detailed Ticket Information",
        doc.internal.pageSize.width / 2,
        y,
        { align: "center" }
      );
      y += 15;

      // Adjust the table width to fit the page properly
      const tableWidth =
        doc.internal.pageSize.width -
        marginLeft * 2;

      // Calculate column widths based on content needs
      const ticketColWidth = tableWidth * 0.2; // 20%
      const typeColWidth = tableWidth * 0.3; // 30%
      const startColWidth = tableWidth * 0.25; // 25%
      const endColWidth = tableWidth * 0.25; // 25%

      // Function to truncate text if it's too long
      const truncateText = (
        text: string,
        maxLength: number
      ) => {
        if (!text) return "";
        return text.length > maxLength
          ? text.substring(0, maxLength - 3) +
              "..."
          : text;
      };

      // Group tickets by service name and service type
      const MAX_TICKETS = 500; // Limit for performance
      const ticketsToProcess =
        reportData.ticketDetails.slice(
          0,
          MAX_TICKETS
        );

      // Sort tickets by date and time
      ticketsToProcess.sort((a, b) => {
        return a.dateTime.localeCompare(
          b.dateTime
        );
      });

      // Create a map to group tickets: Service -> ServiceType -> Tickets[]
      const groupedTickets = new Map<
        string,
        Map<string, TicketDetail[]>
      >();

      // Group the tickets
      ticketsToProcess.forEach((ticket) => {
        if (
          !groupedTickets.has(ticket.serviceName)
        ) {
          groupedTickets.set(
            ticket.serviceName,
            new Map<string, TicketDetail[]>()
          );
        }

        const serviceGroup = groupedTickets.get(
          ticket.serviceName
        );
        if (
          !serviceGroup!.has(
            ticket.serviceTypeName
          )
        ) {
          serviceGroup!.set(
            ticket.serviceTypeName,
            []
          );
        }

        serviceGroup!
          .get(ticket.serviceTypeName)!
          .push(ticket);
      });

      // Function to add table headers for ticket details
      const addTicketTableHeaders = () => {
        doc.setFillColor(
          secondaryColor[0],
          secondaryColor[1],
          secondaryColor[2]
        );
        doc.rect(
          marginLeft,
          y - 5,
          tableWidth,
          10,
          "F"
        );
        doc.setFontSize(10);
        doc.setTextColor(255, 255, 255);

        const col1 = marginLeft + 5;
        const col2 = col1 + ticketColWidth;
        const col3 = col2 + typeColWidth * 0.8; // Adjust column width to fit remarks
        const col4 = col3 + startColWidth * 0.8; // Adjust column width to fit remarks
        const col5 = col4 + startColWidth * 0.8; // New column for remarks

        doc.text("Ticket #", col1, y);
        doc.text("Service Type", col2, y);
        doc.text("Service Start", col3, y);
        doc.text("Service End", col4, y);
        doc.text("Remarks", col5, y); // Add remarks column header

        y += 10;
        return { col1, col2, col3, col4, col5 }; // Return col5 as well
      };

      // Function to add consistent header on new pages
      const addPageHeader = () => {
        doc.addPage();
        y = 20;

        // Add logo and branding
        doc.addImage(
          `data:image/png;base64,${logoBase64}`,
          "PNG",
          marginLeft,
          y,
          20,
          20
        );
        doc.setFontSize(12);
        doc.setTextColor(
          primaryColor[0],
          primaryColor[1],
          primaryColor[2]
        );
        doc.text(
          "General Santos City Water District",
          marginLeft + 25,
          y + 7
        );
        doc.setDrawColor(
          accentColor[0],
          accentColor[1],
          accentColor[2]
        );
        doc.line(
          marginLeft,
          y + 25,
          doc.internal.pageSize.width -
            marginLeft,
          y + 25
        );
        y += 40;
      };

      // Process each service and its types
      for (const [
        serviceName,
        serviceTypes,
      ] of groupedTickets.entries()) {
        // Check if we need a new page
        if (y > 250) {
          addPageHeader();
        }

        // Service name as header - simple styling without background
        doc.setFontSize(14);
        doc.setTextColor(
          primaryColor[0],
          primaryColor[1],
          primaryColor[2]
        );
        doc.text(serviceName, marginLeft, y);
        y += 15;

        // Process each service type within this service
        for (const [
          serviceTypeName,
          tickets,
        ] of serviceTypes.entries()) {
          // Check if we need a new page
          if (y > 250) {
            addPageHeader();

            // Repeat service header on new page - simple styling without background
            doc.setFontSize(14);
            doc.setTextColor(
              primaryColor[0],
              primaryColor[1],
              primaryColor[2]
            );
            doc.text(
              `${serviceName} (continued)`,
              marginLeft,
              y
            );
            y += 15;
          }

          // Service type subheader
          doc.setFontSize(12);
          doc.setTextColor(
            secondaryColor[0],
            secondaryColor[1],
            secondaryColor[2]
          );
          doc.text(
            `Type: ${serviceTypeName}`,
            marginLeft,
            y
          );
          y += 10;

          // Table headers
          const { col1, col2, col3, col4, col5 } =
            addTicketTableHeaders();

          // Display ticket rows with alternating colors
          let rowCount = 0;
          tickets.forEach((ticket) => {
            if (y > 270) {
              addPageHeader();

              // Repeat service and type headers on new page
              doc.setFontSize(14);
              doc.setTextColor(
                primaryColor[0],
                primaryColor[1],
                primaryColor[2]
              );
              doc.text(
                `${serviceName} - ${serviceTypeName} (continued)`,
                marginLeft,
                y
              );
              y += 15;

              // Repeat table headers
              const columns = addTicketTableHeaders();
              const { col1: newCol1, col2: newCol2, col3: newCol3, col4: newCol4, col5: newCol5 } = columns;
              Object.assign({ col1, col2, col3, col4, col5 }, columns);
              rowCount = 0;
            }

            // Alternate row background
            if (rowCount % 2 === 0) {
              doc.setFillColor(245, 245, 245);
              doc.rect(
                marginLeft,
                y - 4,
                tableWidth,
                7,
                "F"
              );
            }

            // Render each column
            doc.setFontSize(8);
            doc.setTextColor(
              textColor[0],
              textColor[1],
              textColor[2]
            );

            doc.text(
              `${ticket.prefix}-${ticket.ticketNumber}`,
              col1,
              y
            );
            doc.text(
              truncateText(
                ticket.serviceTypeName,
                30
              ),
              col2,
              y
            );
            doc.text(
              ticket.servingStart === "-"
                ? "-"
                : formatDateTime(
                    ticket.servingStart
                  ),
              col3,
              y
            );
            doc.text(
              ticket.servingEnd === "-"
                ? "-"
                : formatDateTime(
                    ticket.servingEnd
                  ),
              col4,
              y
            );
            doc.text(
              truncateText(
                ticket.remarks || "",
                25
              ), // Truncate long remarks
              col5,
              y
            );

            y += 7;
            rowCount++;
          });

          // Add space after each service type table
          y += 15;
        }
      }

      if (
        reportData.ticketDetails.length >
        MAX_TICKETS
      ) {
        y += 10;
        doc.setFontSize(9);
        doc.setTextColor(
          secondaryColor[0],
          secondaryColor[1],
          secondaryColor[2]
        );
        doc.text(
          `Note: Only showing first ${MAX_TICKETS} out of ${reportData.ticketDetails.length} tickets for performance reasons.`,
          marginLeft,
          y
        );
      }

      // Add a footer with page number on each page
      const totalPages =
        doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(
          textColor[0],
          textColor[1],
          textColor[2]
        );
        doc.text(
          `Page ${i} of ${totalPages}`,
          doc.internal.pageSize.width / 2,
          doc.internal.pageSize.height - 10,
          { align: "center" }
        );
        doc.text(
          `Generated on: ${new Date().toLocaleDateString()}`,
          doc.internal.pageSize.width -
            marginLeft,
          doc.internal.pageSize.height - 10,
          { align: "right" }
        );
      }
    }

    // Convert PDF to buffer
    const pdfBuffer = Buffer.from(
      doc.output("arraybuffer")
    );

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
    console.error(
      "Error generating PDF report:",
      error
    );
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
