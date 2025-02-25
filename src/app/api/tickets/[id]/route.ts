import { NextRequest, NextResponse } from "next/server";
import { QueueStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// GET a single ticket by ID
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = await context.params;

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
  context: { params: { id: string } }
) {
  const { id } = await context.params;

  try {
    const { status, counterId } = await request.json();

    // Validate status provided and allowed update (e.g. to CALLED, SERVING, LAPSED, etc.)
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

    // If status is LAPSED, enforce max of 2 lapsed tickets by cancelling the oldest if needed.
    if (status === QueueStatus.LAPSED) {
      const ticketRecord = await prisma.queueTicket.findUnique({
        where: { id },
      });
      if (!ticketRecord) {
        return new NextResponse(JSON.stringify({ error: "Ticket not found" }), {
          status: 404,
        });
      }
      const lapsedTickets = await prisma.queueTicket.findMany({
        where: {
          serviceId: ticketRecord.serviceId,
          status: QueueStatus.LAPSED,
        },
        orderBy: { createdAt: "asc" },
      });
      if (lapsedTickets.length >= 2) {
        const oldest = lapsedTickets[0];
        await prisma.queueTicket.update({
          where: { id: oldest.id },
          data: { status: QueueStatus.CANCELLED },
        });
      }
    }

    const data: {
      status: QueueStatus;
      servingStart?: Date;
      servingEnd?: Date;
    } = { status };
    if (status === QueueStatus.SERVING) {
      data.servingStart = new Date();
    } else if (status === QueueStatus.SERVED) {
      data.servingEnd = new Date();
    }

    const updatedTicket = await prisma.queueTicket.update({
      where: { id },
      data: {
        ...data,
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
