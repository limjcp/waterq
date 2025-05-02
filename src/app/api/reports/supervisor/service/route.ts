import {
  NextRequest,
  NextResponse,
} from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  // Check authentication
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  if (
    !session.user.role.includes("supervisor") &&
    !session.user.role.includes("admin")
  ) {
    return NextResponse.json(
      { error: "Insufficient permissions" },
      { status: 403 }
    );
  }

  try {
    const searchParams =
      request.nextUrl.searchParams;
    const serviceId =
      searchParams.get("serviceId");
    const startDate =
      searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const userId = searchParams.get("userId"); // New filter parameter
    const serviceTypeId = searchParams.get(
      "serviceTypeId"
    ); // New filter parameter

    if (!serviceId || !startDate || !endDate) {
      return NextResponse.json(
        {
          error:
            "Missing required parameters: serviceId, startDate, endDate",
        },
        { status: 400 }
      );
    }

    // Verify this supervisor is authorized for this service if they're not an admin
    if (
      session.user.role.includes("supervisor") &&
      !session.user.role.includes("admin")
    ) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          supervisedService: true,
        },
      });

      if (
        !user?.supervisedService ||
        user.supervisedService.id !== serviceId
      ) {
        return NextResponse.json(
          {
            error:
              "Not authorized to access this service's reports",
          },
          { status: 403 }
        );
      }
    }

    // Parse dates
    const startDateTime = new Date(
      `${startDate}T00:00:00`
    );
    const endDateTime = new Date(
      `${endDate}T23:59:59`
    );

    // Build filter conditions
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
        return NextResponse.json({
          serviceName: "Service Report",
          ticketsServed: 0,
          averageServiceTime: 0,
          serviceByDay: [],
          serviceTypesBreakdown: [],
          ticketDetails: [],
        });
      }
    }

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

    // Calculate metrics
    const serviceName =
      tickets.length > 0
        ? tickets[0].service.name
        : "Service Report";

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
            ticket.servingEnd.toLocaleString(),
          serviceTime: serviceTime,
          staffName: ticket.counter?.User[0]
            ? `${ticket.counter.User[0].firstName} ${ticket.counter.User[0].lastName}`
            : "Unknown",
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

    return NextResponse.json({
      serviceName,
      ticketsServed: tickets.length,
      averageServiceTime,
      serviceByDay: serviceByDayArray,
      serviceTypesBreakdown,
      ticketDetails,
    });
  } catch (error) {
    console.error(
      "Error generating service report:",
      error
    );
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
