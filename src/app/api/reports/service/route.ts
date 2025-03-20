import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { QueueStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  // Check authentication
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Extract query parameters
  const searchParams = request.nextUrl.searchParams;
  const serviceId = searchParams.get("serviceId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (!serviceId || !startDate || !endDate) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  try {
    // Get service details
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: {
        id: true,
        name: true,
        code: true,
      },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Parse dates
    const startDateTime = new Date(`${startDate}T00:00:00`);
    const endDateTime = new Date(`${endDate}T23:59:59`);

    // Get all served tickets for this service in the date range
    const tickets = await prisma.queueTicket.findMany({
      where: {
        status: QueueStatus.SERVED,
        serviceId: service.id,
        updatedAt: {
          gte: startDateTime,
          lte: endDateTime,
        },
      },
      include: {
        service: {
          select: { name: true },
        },
        serviceType: {
          select: {
            name: true,
            service: {
              select: { name: true },
            },
          },
        },
      },
    });

    // Calculate statistics (similar to staff report)
    const ticketsServed = tickets.length;

    // Calculate average service time
    let totalServiceTime = 0;
    let ticketsWithServiceTime = 0;

    tickets.forEach((ticket) => {
      if (ticket.servingStart && ticket.servingEnd) {
        const serviceTime = Math.floor(
          (ticket.servingEnd.getTime() - ticket.servingStart.getTime()) / 1000
        );
        totalServiceTime += serviceTime;
        ticketsWithServiceTime++;
      }
    });

    const averageServiceTime =
      ticketsWithServiceTime > 0
        ? Math.round(totalServiceTime / ticketsWithServiceTime)
        : 0;

    // Group by day
    const serviceByDay = [];
    const dayMap = new Map<string, number>();

    tickets.forEach((ticket) => {
      const date = ticket.updatedAt.toISOString().split("T")[0];
      dayMap.set(date, (dayMap.get(date) || 0) + 1);
    });

    dayMap.forEach((count, date) => {
      serviceByDay.push({ date, count });
    });
    serviceByDay.sort((a, b) => a.date.localeCompare(b.date));

    // Group by service type
    const serviceTypeMap = new Map<string, number>();
    tickets.forEach((ticket) => {
      const typeName = ticket.serviceType?.name || "Unspecified";
      serviceTypeMap.set(typeName, (serviceTypeMap.get(typeName) || 0) + 1);
    });

    const serviceTypesBreakdown = [
      {
        serviceName: service.name,
        types: Array.from(serviceTypeMap.entries()).map(
          ([typeName, count]) => ({
            typeName,
            count,
          })
        ),
      },
    ];

    // Create detailed ticket information
    const ticketDetails = tickets.map((ticket) => {
      // Calculate service time for this ticket
      let serviceTime = 0;
      if (ticket.servingStart && ticket.servingEnd) {
        serviceTime = Math.floor(
          (ticket.servingEnd.getTime() - ticket.servingStart.getTime()) / 1000
        );
      }

      return {
        ticketNumber: ticket.ticketNumber.toString(),
        prefix: ticket.prefix,
        serviceName: ticket.service?.name || "Unknown",
        serviceTypeName: ticket.serviceType?.name || "Unspecified",
        dateTime: ticket.updatedAt.toLocaleString(), // Format as readable date and time
        serviceTime: serviceTime,
      };
    });

    // Prepare response with added ticket details
    const reportData = {
      username: service.code,
      name: service.name,
      ticketsServed,
      averageServiceTime,
      serviceByDay,
      serviceTypesBreakdown,
      ticketDetails, // Add detailed ticket information
    };

    return NextResponse.json(reportData);
  } catch (error) {
    console.error("Error generating service report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
