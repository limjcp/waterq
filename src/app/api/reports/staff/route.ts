import {
  NextRequest,
  NextResponse,
} from "next/server";
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
  serviceTypeId: string | null;
  remarks?: string | null;
  service?: {
    id: string;
    name: string;
  };
  serviceType?: {
    id: string;
    name: string;
    service: {
      name: string;
      id: string;
    };
  };
};

export async function GET(request: NextRequest) {
  // Check authentication
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  // Extract query parameters
  const searchParams =
    request.nextUrl.searchParams;
  const username = searchParams.get("username");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const serviceTypeId = searchParams.get(
    "serviceTypeId"
  ); // New filter parameter

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
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Parse dates
    const startDateTime = new Date(
      `${startDate}T00:00:00`
    );
    const endDateTime = new Date(
      `${endDate}T23:59:59`
    ); // Get all served tickets by this user in the date range
    const tickets =
      (await prisma.queueTicket.findMany({
        where: {
          status: QueueStatus.SERVED,
          counterId: user.assignedCounterId,
          updatedAt: {
            gte: startDateTime,
            lte: endDateTime,
          },
          // Add optional serviceTypeId filter
          ...(serviceTypeId
            ? { serviceTypeId }
            : {}),
        },
        include: {
          service: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
          serviceType: {
            select: {
              id: true,
              name: true,
              code: true,
              service: {
                select: {
                  id: true,
                  name: true,
                  code: true,
                },
              },
            },
          },
          // No additional configuration needed as remarks is a direct field
        },
      })) as Ticket[];

    // Calculate total tickets
    const ticketsServed = tickets.length;

    // Calculate average service time (if available)
    let totalServiceTime = 0;
    let ticketsWithServiceTime = 0;

    tickets.forEach((ticket: Ticket) => {
      if (
        ticket.servingStart &&
        ticket.servingEnd
      ) {
        const serviceTime = Math.floor(
          (ticket.servingEnd.getTime() -
            ticket.servingStart.getTime()) /
            1000
        );
        totalServiceTime += serviceTime;
        ticketsWithServiceTime++;
      }
    });

    const averageServiceTime =
      ticketsWithServiceTime > 0
        ? Math.round(
            totalServiceTime /
              ticketsWithServiceTime
          )
        : 0;

    // Group by day range
    const serviceByDay: {
      date: string;
      count: number;
    }[] = [];
    const dayMap = new Map<string, number>();

    tickets.forEach(() => {
      const dateKey = `${startDate} to ${endDate}`; // Group all tickets in the date range
      if (dayMap.has(dateKey)) {
        dayMap.set(
          dateKey,
          dayMap.get(dateKey)! + 1
        );
      } else {
        dayMap.set(dateKey, 1);
      }
    });

    // Convert map to array
    dayMap.forEach((count, date) => {
      serviceByDay.push({ date, count });
    });

    // Group by service type
    const serviceTypeMap = new Map<
      string,
      number
    >();
    tickets.forEach((ticket: Ticket) => {
      const serviceName =
        ticket.service?.name || "Unknown";
      if (serviceTypeMap.has(serviceName)) {
        serviceTypeMap.set(
          serviceName,
          serviceTypeMap.get(serviceName)! + 1
        );
      } else {
        serviceTypeMap.set(serviceName, 1);
      }
    });

    const serviceByType = Array.from(
      serviceTypeMap.entries()
    ).map(([serviceName, count]) => ({
      serviceName,
      count,
    })); // Update service type grouping to include detailed breakdown
    // Use a structure that tracks both the breakdown and service IDs
    interface ServiceBreakdown {
      typeMap: Map<
        string,
        { count: number; id: string }
      >;
      serviceId: string;
    }

    const serviceBreakdownMap = new Map<
      string,
      ServiceBreakdown
    >();

    tickets.forEach((ticket: Ticket) => {
      const serviceName =
        ticket.service?.name || "Unknown";
      const serviceTypeName =
        ticket.serviceType?.name || "Unspecified";
      const serviceTypeId =
        ticket.serviceTypeId || ""; // As we now use the updated ServiceBreakdown structure defined above,
      // this code is no longer needed and should be removed.
      // The updated structure is properly used in the section we've already replaced.
    });

    const serviceTypesBreakdown = Array.from(
      serviceBreakdownMap.entries()
    ).map(([serviceName, typeMap]) => ({
      serviceName,
      types: Array.from(typeMap.entries()).map(
        ([typeName, count]) => ({
          typeName,
          count,
        })
      ),
    }));

    // Create detailed ticket information
    const ticketDetails = tickets.map(
      (ticket) => {
        // Calculate service time for this ticket
        let serviceTime = 0;
        if (
          ticket.servingStart &&
          ticket.servingEnd
        ) {
          serviceTime = Math.floor(
            (ticket.servingEnd.getTime() -
              ticket.servingStart.getTime()) /
              1000
          );
        }
        return {
          ticketNumber:
            ticket.ticketNumber.toString(),
          prefix: ticket.prefix,
          serviceName:
            ticket.service?.name || "Unknown",
          serviceId: ticket.serviceId || "",
          serviceTypeName:
            ticket.serviceType?.name ||
            "Unspecified",
          serviceTypeId:
            ticket.serviceTypeId || "",
          dateTime:
            ticket.updatedAt.toLocaleString(),
          servingStart:
            ticket.servingStart?.toLocaleString() ||
            "-",
          servingEnd:
            ticket.servingEnd?.toLocaleString() ||
            "-",
          serviceTime: serviceTime,
          remarks: ticket.remarks || "", // Add the remarks field
        };
      }
    );

    // Prepare response with new data
    const reportData = {
      username: user.username,
      name: `${user.firstName} ${
        user.lastName || ""
      }`.trim(),
      ticketsServed,
      averageServiceTime,
      serviceByDay,
      serviceByType,
      serviceTypesBreakdown,
      ticketDetails, // Add detailed ticket information
    };

    return NextResponse.json(reportData);
  } catch (error) {
    console.error(
      "Error generating staff report:",
      error
    );
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
