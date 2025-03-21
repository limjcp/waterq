import { NextRequest, NextResponse } from "next/server";
import { QueueStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  emitTicketUpdate,
  emitCounterUpdate,
  emitStatsUpdate,
} from "@/lib/socket-io";

// GET a single ticket by ID
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = context.params;

  try {
    const ticket = await prisma.queueTicket.findUnique({
      where: { id },
      include: {
        service: true,
        serviceType: true,
        counter: true,
      },
    });

    if (!ticket) {
      return new NextResponse(JSON.stringify({ error: "Ticket not found" }), {
        status: 404,
      });
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return new NextResponse(JSON.stringify({ error: "Server error" }), {
      status: 500,
    });
  }
}

// Update a ticket's status
export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = context.params;

  try {
    const data = await request.json();

    // Validate status provided and allowed update
    if (!data.status || !Object.values(QueueStatus).includes(data.status)) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid or missing status" }),
        { status: 400 }
      );
    }

    // If a counterId is provided, verify counter belongs to same service as ticket
    if (data.counterId) {
      const [ticket, counter] = await Promise.all([
        prisma.queueTicket.findUnique({ where: { id } }),
        prisma.counter.findUnique({ where: { id: data.counterId } }),
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
            error: "The provided counter does not match the ticket's service.",
          }),
          { status: 400 }
        );
      }
    }

    // Update the ticket with complete data
    const updatedTicket = await prisma.queueTicket.update({
      where: { id },
      data: {
        status: data.status as QueueStatus,
        counter: data.counterId
          ? { connect: { id: data.counterId } }
          : data.status === "RETURNING"
          ? { disconnect: true }
          : undefined,
        serviceType: data.serviceTypeId
          ? { connect: { id: data.serviceTypeId } }
          : undefined,
        servingStart: data.servingStart
          ? new Date(data.servingStart)
          : undefined,
        servingEnd: data.servingEnd ? new Date(data.servingEnd) : undefined,
      },
      include: {
        service: true,
        serviceType: true,
        counter: true,
      },
    });

    // Emit Socket.IO events with complete data
    emitTicketUpdate(updatedTicket);

    // If ticket is assigned to a counter, also emit counter-specific update
    if (updatedTicket.counterId) {
      emitCounterUpdate(updatedTicket.counterId, updatedTicket);
    }

    // If ticket is completed (SERVED), emit stats update
    if (data.status === "SERVED" && updatedTicket.counterId) {
      // Fetch updated user stats
      const user = await prisma.user.findFirst({
        where: { assignedCounterId: updatedTicket.counterId },
      });

      if (user) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get updated statistics
        const [totalServed, todayServed, ticketsWithTime] = await Promise.all([
          prisma.queueTicket.count({
            where: {
              counterId: updatedTicket.counterId,
              status: "SERVED",
            },
          }),
          prisma.queueTicket.count({
            where: {
              counterId: updatedTicket.counterId,
              status: "SERVED",
              updatedAt: {
                gte: today,
              },
            },
          }),
          prisma.queueTicket.findMany({
            where: {
              counterId: updatedTicket.counterId,
              status: "SERVED",
              servingStart: { not: null },
              servingEnd: { not: null },
            },
            select: {
              servingStart: true,
              servingEnd: true,
            },
          }),
        ]);

        // Calculate average service time
        let averageServiceTime = 0;
        if (ticketsWithTime.length > 0) {
          const totalServiceTime = ticketsWithTime.reduce((acc, ticket) => {
            if (ticket.servingStart && ticket.servingEnd) {
              const serviceDuration = Math.floor(
                (ticket.servingEnd.getTime() - ticket.servingStart.getTime()) /
                  1000
              );
              return acc + serviceDuration;
            }
            return acc;
          }, 0);

          averageServiceTime = Math.round(
            totalServiceTime / ticketsWithTime.length
          );
        }

        // Emit stats update with complete data
        emitStatsUpdate({
          username: user.username,
          totalServed,
          todayServed,
          averageServiceTime,
        });
      }
    }

    return NextResponse.json(updatedTicket);
  } catch (error) {
    console.error("Error updating ticket:", error);
    return NextResponse.json(
      { error: "Failed to update ticket" },
      { status: 500 }
    );
  }
}
