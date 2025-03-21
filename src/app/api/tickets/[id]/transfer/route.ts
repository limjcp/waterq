import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { QueueStatus } from "@prisma/client";
import { emitTicketUpdate } from "@/lib/socket-io";

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = context.params;

  try {
    const { serviceId } = await request.json();

    if (!serviceId) {
      return NextResponse.json(
        { error: "Service ID is required" },
        { status: 400 }
      );
    }

    // Update the ticket to be transferred with complete data fetch
    const updatedTicket = await prisma.queueTicket.update({
      where: { id },
      data: {
        status: QueueStatus.RETURNING,
        service: { connect: { id: serviceId } },
        counter: { disconnect: true }, // Disconnect from current counter
      },
      include: {
        service: true,
        serviceType: true,
        counter: true,
      },
    });

    // Emit update event with complete ticket data
    emitTicketUpdate(updatedTicket);

    return NextResponse.json(updatedTicket);
  } catch (error) {
    console.error("Error transferring ticket:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
