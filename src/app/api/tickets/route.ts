import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { QueueStatus } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { serviceCode, isPrioritized } = body;
    if (!serviceCode) {
      return NextResponse.json(
        { error: "Missing serviceCode" },
        { status: 400 }
      );
    }

    // 1. Find the service by its code
    const service = await prisma.service.findUnique({
      where: { code: serviceCode },
    });
    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // 2. Find all counters that handle this service
    const counters = await prisma.counter.findMany({
      where: { serviceId: service.id },
    });

    // 3. Get the counter with the least pending tickets
    let selectedCounter = null;
    if (counters.length > 0) {
      // Get pending ticket counts for each counter
      const countersWithTicketCounts = await Promise.all(
        counters.map(async (counter) => {
          const pendingTicketsCount = await prisma.queueTicket.count({
            where: {
              counterId: counter.id,
              status: QueueStatus.PENDING,
            },
          });
          return {
            counter,
            pendingTicketsCount,
          };
        })
      );

      // Sort by pending ticket count (ascending) and get the counter with fewest tickets
      countersWithTicketCounts.sort(
        (a, b) => a.pendingTicketsCount - b.pendingTicketsCount
      );
      selectedCounter = countersWithTicketCounts[0].counter;
    }

    // 4. Find the last ticket for that service to get the next ticket number
    const lastTicket = await prisma.queueTicket.findFirst({
      where: { serviceId: service.id },
      orderBy: { ticketNumber: "desc" },
    });
    const nextTicketNumber = lastTicket ? lastTicket.ticketNumber + 1 : 1;

    // 5. Create the new ticket - Always assign to a counter if one is available
    const ticketStatus = selectedCounter
      ? QueueStatus.PENDING
      : QueueStatus.CALLED;

    const newTicket = await prisma.queueTicket.create({
      data: {
        ticketNumber: nextTicketNumber,
        prefix: service.code,
        status: ticketStatus,
        isPrioritized: isPrioritized,
        service: { connect: { id: service.id } },
        // Always assign to the selected counter if available, regardless of prioritization
        ...(selectedCounter
          ? { counter: { connect: { id: selectedCounter.id } } }
          : {}),
      },
    });

    // Return more detailed information about the ticket and counter
    return NextResponse.json(
      {
        ticketNumber: `${newTicket.prefix}${newTicket.ticketNumber}`,
        status: newTicket.status,
        counterId: selectedCounter ? selectedCounter.id : null,
        counterName: selectedCounter ? selectedCounter.name : null,
        isPrioritized: newTicket.isPrioritized,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
