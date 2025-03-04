import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const serviceId = searchParams.get("serviceId");
    const excludeCounterId = searchParams.get("excludeCounterId");

    if (!serviceId || !excludeCounterId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Find all counters with the same service
    const counters = await prisma.counter.findMany({
      where: {
        serviceId: serviceId,
        id: { not: excludeCounterId },
      },
      include: {
        tickets: {
          where: {
            OR: [{ status: "CALLED" }, { status: "SERVING" }],
          },
          include: {
            service: true,
          },
          orderBy: {
            createdAt: "asc",
          },
          take: 1,
        },
      },
    });

    // Format response
    const counterStatus = counters.map((counter) => ({
      counterId: counter.id,
      counterName: counter.name,
      ticket: counter.tickets.length > 0 ? counter.tickets[0] : null,
    }));

    return NextResponse.json(counterStatus);
  } catch (error) {
    console.error("Error fetching tickets by service:", error);
    return NextResponse.json(
      { error: "Failed to fetch tickets by service" },
      { status: 500 }
    );
  }
}
