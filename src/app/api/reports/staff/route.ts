import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { QueueStatus } from "@prisma/client";

// Define types based on Prisma schema
type Ticket = {
  id: string;
  ticketNumber: number;
  prefix: string;
  status: QueueStatus;
  serviceId: string;
  counterId: string | null;
  createdAt: Date;
  updatedAt: Date;
  servingStart: Date | null;
  servingEnd: Date | null;
  isPrioritized: boolean;
  service?: {
    name: string;
  };
  serviceType?: {
    name: string;
    service: {
      name: string;
    };
  };
};

export async function GET(request: NextRequest) {
  // Check authentication
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Extract query parameters
  const searchParams = request.nextUrl.searchParams;
  const username = searchParams.get("username");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (!username || !startDate || !endDate) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  try {
    // Get user details
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        assignedCounterId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Parse dates
    const startDateTime = new Date(`${startDate}T00:00:00`);
    const endDateTime = new Date(`${endDate}T23:59:59`);

    // Get all served tickets by this user in the date range
    const tickets = (await prisma.queueTicket.findMany({
      where: {
        status: QueueStatus.SERVED,
        counterId: user.assignedCounterId,
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
    })) as Ticket[];

    // Calculate total tickets
    const ticketsServed = tickets.length;

    // Calculate average service time (if available)
    let totalServiceTime = 0;
    let ticketsWithServiceTime = 0;

    tickets.forEach((ticket: Ticket) => {
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
    const serviceByDay: { date: string; count: number }[] = [];
    const dayMap = new Map<string, number>();

    tickets.forEach((ticket: Ticket) => {
      const date = ticket.updatedAt.toISOString().split("T")[0];
      if (dayMap.has(date)) {
        dayMap.set(date, dayMap.get(date)! + 1);
      } else {
        dayMap.set(date, 1);
      }
    });

    // Convert map to array and sort by date
    dayMap.forEach((count, date) => {
      serviceByDay.push({ date, count });
    });
    serviceByDay.sort((a, b) => a.date.localeCompare(b.date));

    // Group by service type
    const serviceTypeMap = new Map<string, number>();
    tickets.forEach((ticket: Ticket) => {
      const serviceName = ticket.service?.name || "Unknown";
      if (serviceTypeMap.has(serviceName)) {
        serviceTypeMap.set(serviceName, serviceTypeMap.get(serviceName)! + 1);
      } else {
        serviceTypeMap.set(serviceName, 1);
      }
    });

    const serviceByType = Array.from(serviceTypeMap.entries()).map(
      ([serviceName, count]) => ({ serviceName, count })
    );

    // Update service type grouping to include detailed breakdown
    const serviceBreakdownMap = new Map<string, Map<string, number>>();

    tickets.forEach((ticket: Ticket) => {
      const serviceName = ticket.service?.name || "Unknown";
      const serviceTypeName = ticket.serviceType?.name || "Unspecified";

      if (!serviceBreakdownMap.has(serviceName)) {
        serviceBreakdownMap.set(serviceName, new Map<string, number>());
      }

      const typeMap = serviceBreakdownMap.get(serviceName)!;
      typeMap.set(serviceTypeName, (typeMap.get(serviceTypeName) || 0) + 1);
    });

    const serviceTypesBreakdown = Array.from(serviceBreakdownMap.entries()).map(
      ([serviceName, typeMap]) => ({
        serviceName,
        types: Array.from(typeMap.entries()).map(([typeName, count]) => ({
          typeName,
          count,
        })),
      })
    );

    // Prepare response with new data
    const reportData = {
      username: user.username,
      name: `${user.firstName} ${user.lastName || ""}`.trim(),
      ticketsServed,
      averageServiceTime,
      serviceByDay,
      serviceByType,
      serviceTypesBreakdown,
    };

    return NextResponse.json(reportData);
  } catch (error) {
    console.error("Error generating staff report:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
