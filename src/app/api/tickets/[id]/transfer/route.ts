import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { QueueStatus } from "@prisma/client";

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = await context.params;

  try {
    const { serviceId } = await request.json();

    if (!serviceId) {
      return NextResponse.json(
        { error: "Service ID is required" },
        { status: 400 }
      );
    }

    // Get the ticket and verify it exists
    const ticket = await prisma.queueTicket.findUnique({
      where: { id },
      include: { service: true },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Get the destination service
    const destinationService = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!destinationService) {
      return NextResponse.json(
        { error: "Destination service not found" },
        { status: 404 }
      );
    }

    // Store the original service code in the prefix field if this is the first transfer
    // We use format "ORIG:P" where P is the original service code
    const originalPrefix = ticket.prefix.startsWith("ORIG:")
      ? ticket.prefix // keep existing original prefix if already set
      : `ORIG:${ticket.service.code}`; // set new original prefix

    // Update the ticket to be transferred, preserving original service code
    const updatedTicket = await prisma.queueTicket.update({
      where: { id },
      data: {
        status: QueueStatus.RETURNING,
        prefix: originalPrefix,
        service: { connect: { id: serviceId } },
        counter: { disconnect: true }, // Disconnect from current counter
      },
    });

    return NextResponse.json(updatedTicket);
  } catch (error) {
    console.error("Error transferring ticket:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
