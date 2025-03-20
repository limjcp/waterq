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

    // Get today's date with time set to beginning of day for comparison
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    // Get the latest ticket with the same prefix from today
    // Note: Using prefix instead of serviceId for ticket numbering
    const latestTicket = await prisma.queueTicket.findFirst({
      where: {
        prefix: service.code, // Using prefix instead of serviceId
        createdAt: {
          gte: startOfDay,
        },
      },
      orderBy: { ticketNumber: "desc" },
    });

    // Log for debugging
    console.log("Latest ticket found with prefix:", latestTicket);

    let nextTicketNumber = 1; // Default for a new day

    if (latestTicket) {
      // If today's ticket exists, increment the number
      nextTicketNumber = latestTicket.ticketNumber + 1;
      console.log("Using next ticket number:", nextTicketNumber);
    } else {
      // No ticket today yet, starting from 1
      console.log("No tickets found today with this prefix, starting from 1");
    }

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

    console.log("Created new ticket:", newTicket);

    // Format ticket number with leading zeros
    const formattedTicketNumber = `${newTicket.prefix}-${String(
      newTicket.ticketNumber
    ).padStart(3, "0")}`;

    // Return ticket information
    return NextResponse.json(
      {
        ticketNumber: formattedTicketNumber,
        status: newTicket.status,
        counterId: null,
        counterName: null,
        isPrioritized: newTicket.isPrioritized,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error generating ticket:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
