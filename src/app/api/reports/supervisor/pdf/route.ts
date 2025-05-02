import {
  NextRequest,
  NextResponse,
} from "next/server";
import { auth } from "@/auth";
import puppeteer from "puppeteer";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  // Check authentication
  const session = await auth();
  if (
    !session?.user?.role?.includes(
      "supervisor"
    ) &&
    !session?.user?.role?.includes("admin")
  ) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const data = await request.json();
    const {
      reportType,
      serviceId,
      startDate,
      endDate,
      userId,
      serviceTypeId,
    } = data;

    if (
      !reportType ||
      !serviceId ||
      !startDate ||
      !endDate
    ) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // FIXED: Get the report data directly rather than trying to fetch it via HTTP
    // This avoids URL construction issues and HTML error pages

    // Create the parameters for our query
    const startDateTime = new Date(
      `${startDate}T00:00:00`
    );
    const endDateTime = new Date(
      `${endDate}T23:59:59`
    );

    // Build filter conditions - similar to what's in your reports/service route
    let whereConditions: any = {
      serviceId: serviceId,
      status: "SERVED",
      servingEnd: {
        gte: startDateTime,
        lte: endDateTime,
      },
    };

    // Add service type filter if provided
    if (
      serviceTypeId &&
      serviceTypeId !== "all"
    ) {
      whereConditions.serviceTypeId =
        serviceTypeId;
    }

    // For user filter, we need to find counters assigned to this user
    if (userId && userId !== "all") {
      const userCounters =
        await prisma.user.findUnique({
          where: { id: userId },
          select: {
            assignedCounterId: true,
          },
        });

      if (userCounters?.assignedCounterId) {
        whereConditions.counterId =
          userCounters.assignedCounterId;
      } else {
        // If user has no counter, return empty report
        const emptyReport = {
          serviceName: "Service Report",
          ticketsServed: 0,
          averageServiceTime: 0,
          serviceByDay: [],
          serviceTypesBreakdown: [],
          ticketDetails: [],
        };

        // Generate PDF with empty report
        return generatePDF(
          emptyReport,
          startDate,
          endDate,
          reportType
        );
      }
    }

    // Get the service name for the report
    const service =
      await prisma.service.findUnique({
        where: { id: serviceId },
        select: { name: true },
      });

    const serviceName = service
      ? service.name
      : "Service Report";

    // Get tickets matching the criteria
    const tickets =
      await prisma.queueTicket.findMany({
        where: whereConditions,
        include: {
          service: {
            select: { name: true },
          },
          serviceType: {
            select: { name: true },
          },
          counter: {
            select: {
              name: true,
              User: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: { servingEnd: "desc" },
      });

    // Process data to the format expected by the report generator
    // This is based on your existing report/service endpoint logic
    let totalServiceTime = 0;
    const ticketDetails = [];
    const serviceByDay: Record<string, number> =
      {};
    const serviceTypeBreakdown: Record<
      string,
      Record<string, number>
    > = {};

    for (const ticket of tickets) {
      if (
        ticket.servingStart &&
        ticket.servingEnd
      ) {
        const serviceTime = Math.round(
          (ticket.servingEnd.getTime() -
            ticket.servingStart.getTime()) /
            1000
        );
        totalServiceTime += serviceTime;

        // Format date for grouping
        const dateStr = ticket.servingEnd
          .toISOString()
          .split("T")[0];
        serviceByDay[dateStr] =
          (serviceByDay[dateStr] || 0) + 1;

        // Group by service type
        const serviceTypeName =
          ticket.serviceType?.name ||
          "Unspecified";
        serviceTypeBreakdown[serviceName] =
          serviceTypeBreakdown[serviceName] || {};
        serviceTypeBreakdown[serviceName][
          serviceTypeName
        ] =
          (serviceTypeBreakdown[serviceName][
            serviceTypeName
          ] || 0) + 1;

        // Add to ticket details
        ticketDetails.push({
          ticketNumber:
            ticket.ticketNumber.toString(),
          prefix: ticket.prefix,
          serviceName: ticket.service.name,
          serviceTypeName: serviceTypeName,
          dateTime:
            ticket.servingEnd.toISOString(),
          serviceTime: serviceTime,
          staffName:
            ticket.counter?.User[0] &&
            `${ticket.counter.User[0].firstName} ${ticket.counter.User[0].lastName}`,
        });
      }
    }

    // Prepare service breakdown structure
    const serviceTypesBreakdown = Object.keys(
      serviceTypeBreakdown
    ).map((serviceName) => ({
      serviceName,
      types: Object.keys(
        serviceTypeBreakdown[serviceName]
      ).map((typeName) => ({
        typeName,
        count:
          serviceTypeBreakdown[serviceName][
            typeName
          ],
      })),
    }));

    // Prepare daily service structure
    const serviceByDayArray = Object.keys(
      serviceByDay
    )
      .map((date) => ({
        date,
        count: serviceByDay[date],
      }))
      .sort((a, b) =>
        a.date.localeCompare(b.date)
      );

    // Average service time in seconds
    const averageServiceTime =
      tickets.length > 0
        ? totalServiceTime / tickets.length
        : 0;

    const reportData = {
      serviceName,
      ticketsServed: tickets.length,
      averageServiceTime,
      serviceByDay: serviceByDayArray,
      serviceTypesBreakdown,
      ticketDetails,
    };

    // Generate PDF with the report data
    return generatePDF(
      reportData,
      startDate,
      endDate,
      reportType
    );
  } catch (error) {
    console.error(
      "Error generating PDF report:",
      error
    );
    return NextResponse.json(
      {
        error: `Failed to generate PDF report: ${error.message}`,
      },
      { status: 500 }
    );
  }
}

// Helper function to generate PDF
async function generatePDF(
  reportData,
  startDate,
  endDate,
  reportType
) {
  try {
    // Generate PDF from the report data
    const browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
    });

    const page = await browser.newPage();

    // Create HTML content for the PDF
    const htmlContent = generateReportHtml(
      reportData,
      startDate,
      endDate
    );

    await page.setContent(htmlContent, {
      waitUntil: "networkidle0",
    });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "1cm",
        right: "1cm",
        bottom: "1cm",
        left: "1cm",
      },
    });

    await browser.close();

    // Return the generated PDF
    return new Response(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${reportType}-report-${startDate}-to-${endDate}.pdf"`,
      },
    });
  } catch (error) {
    console.error(
      "Error in PDF generation:",
      error
    );
    throw error;
  }
}

// Helper function to generate HTML for the PDF
function generateReportHtml(
  reportData,
  startDate,
  endDate
) {
  const {
    serviceName,
    ticketsServed,
    averageServiceTime,
    serviceTypesBreakdown,
    ticketDetails,
  } = reportData;

  // Format time (seconds) as MM:SS
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(
      seconds % 60
    );
    return `${minutes}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Service Report</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        h1, h2, h3 {
          color: #0369a1;
        }
        .period {
          color: #666;
          font-size: 16px;
          margin-bottom: 20px;
        }
        .summary {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          gap: 20px;
        }
        .summary-box {
          background-color: #f0f9ff;
          border-radius: 5px;
          padding: 15px;
          flex: 1;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f0f9ff;
        }
        .section {
          margin-bottom: 30px;
        }
        .page-break {
          page-break-after: always;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Service Report: ${serviceName}</h1>
        <div class="period">Period: ${startDate} to ${endDate}</div>
      </div>

      <div class="summary">
        <div class="summary-box">
          <h3>Total Tickets Served</h3>
          <p style="font-size: 24px; font-weight: bold;">${ticketsServed}</p>
        </div>
        <div class="summary-box">
          <h3>Average Service Time</h3>
          <p style="font-size: 24px; font-weight: bold;">${formatTime(
            averageServiceTime
          )}</p>
        </div>
      </div>

      <div class="section">
        <h2>Service Types Breakdown</h2>
        ${serviceTypesBreakdown
          .map(
            (service) => `
          <h3>${service.serviceName}</h3>
          <table>
            <thead>
              <tr>
                <th>Service Type</th>
                <th>Tickets Served</th>
              </tr>
            </thead>
            <tbody>
              ${service.types
                .map(
                  (type) => `
                <tr>
                  <td>${type.typeName}</td>
                  <td>${type.count}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        `
          )
          .join("")}
      </div>

      <div class="page-break"></div>

      <div class="section">
        <h2>Detailed Ticket Information</h2>
        <table>
          <thead>
            <tr>
              <th>Ticket #</th>
              <th>Service</th>
              <th>Type</th>
              <th>Date & Time</th>
              <th>Service Time</th>
              <th>Staff</th>
            </tr>
          </thead>
          <tbody>
            ${ticketDetails
              .map(
                (ticket) => `
              <tr>
                <td>${ticket.prefix}-${
                  ticket.ticketNumber
                }</td>
                <td>${ticket.serviceName}</td>
                <td>${ticket.serviceTypeName}</td>
                <td>${ticket.dateTime}</td>
                <td>${formatTime(
                  ticket.serviceTime
                )}</td>
                <td>${
                  ticket.staffName || "N/A"
                }</td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    </body>
    </html>
  `;
}
