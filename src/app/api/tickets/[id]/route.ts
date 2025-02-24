import { NextRequest, NextResponse } from "next/server";
import { QueueStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// GET a single ticket by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const ticket = await prisma.queueTicket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return new NextResponse(JSON.stringify({ error: "Ticket not found" }), {
        status: 404,
      });
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error(error);
    return new NextResponse("Server error", { status: 500 });
  }
}

// Update a ticket’s status via PUT (manual re‑call)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const { status, counterId } = await request.json();

    // Validate status provided and allowed update (e.g. to CALLED)
    if (!status || !Object.values(QueueStatus).includes(status)) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid or missing status" }),
        { status: 400 }
      );
    }

    // If a counterId is provided, verify that the counter belongs to the same service as the ticket.
    if (counterId) {
      const [ticket, counter] = await Promise.all([
        prisma.queueTicket.findUnique({ where: { id } }),
        prisma.counter.findUnique({ where: { id: counterId } }),
      ]);

      if (!ticket || !counter) {
        return new NextResponse(
          JSON.stringify({ error: "Ticket or counter not found" }),
          { status: 404 }
        );
      }

      // Validate matching services
      const serviceMismatch = ticket.serviceId !== counter.serviceId;
      if (serviceMismatch) {
        return new NextResponse(
          JSON.stringify({
            error: "The provided counter does not match the ticket’s service.",
          }),
          { status: 400 }
        );
      }
    }

    const updatedTicket = await prisma.queueTicket.update({
      where: { id },
      data: {
        // Update status and optionally assign the counter if provided.
        status,
        ...(counterId ? { counter: { connect: { id: counterId } } } : {}),
      },
    });

    // (Optional) Trigger a manual display update (e.g. beep/re‑announce ticket) here

    return NextResponse.json(updatedTicket);
  } catch (error) {
    console.error(error);
    return new NextResponse("Server error", { status: 500 });
  }
}
