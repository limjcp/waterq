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

    // Update the ticket to be transferred without changing the prefix
    const updatedTicket = await prisma.queueTicket.update({
      where: { id },
      data: {
        status: QueueStatus.RETURNING,
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
