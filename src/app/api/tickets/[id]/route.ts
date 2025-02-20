// app/api/tickets/[id]/route.ts

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

// Update a ticket's status via PUT
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const { status } = await request.json();

    // Validate that status is provided and is one of the enum values
    if (!status || !Object.values(QueueStatus).includes(status)) {
      return new NextResponse(
        JSON.stringify({ error: "Invalid or missing status" }),
        { status: 400 }
      );
    }

    const updatedTicket = await prisma.queueTicket.update({
      where: { id },
      data: { status },
    });

    // (Optional) Trigger a real-time event via Pusher/Socket.IO here

    return NextResponse.json(updatedTicket);
  } catch (error) {
    console.error(error);
    return new NextResponse("Server error", { status: 500 });
  }
}
