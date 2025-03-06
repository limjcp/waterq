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

    // Find the service by its code
    const service = await prisma.service.findUnique({
      where: { code: serviceCode },
    });
    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Get current date at midnight (start of day) for comparison
    const today = new Date();
    const todayString = today.toISOString().split("T")[0]; // YYYY-MM-DD format

    // Get tickets created today for this service
    const todayTickets = await prisma.queueTicket.findMany({
      where: {
        serviceId: service.id,
        createdAt: {
          gte: new Date(todayString), // Start of today
        },
      },
      orderBy: { ticketNumber: "desc" },
    });

    // If there are tickets created today, get the highest number and increment
    // Otherwise start from 1 (it's a new day)
    const nextTicketNumber =
      todayTickets.length > 0 ? todayTickets[0].ticketNumber + 1 : 1;

    // Create new ticket without assigning to any counter
    const newTicket = await prisma.queueTicket.create({
      data: {
        ticketNumber: nextTicketNumber,
        prefix: service.code,
        status: QueueStatus.PENDING,
        isPrioritized: isPrioritized,
        service: { connect: { id: service.id } },
        // No counter connection here
      },
    });

    // Return ticket information
    return NextResponse.json(
      {
        ticketNumber: `${newTicket.prefix}${newTicket.ticketNumber}`,
        status: newTicket.status,
        counterId: null,
        counterName: null,
        isPrioritized: newTicket.isPrioritized,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
