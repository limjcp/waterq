import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { QueueStatus } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { serviceCode } = body;
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

    // 2. Look for an available counter that handles that service (using first found)
    const counter = await prisma.counter.findFirst({
      where: { serviceId: service.id },
    });

    // 3. Find the last ticket for that service (to get next ticketNumber)
    const lastTicket = await prisma.queueTicket.findFirst({
      where: { serviceId: service.id },
      orderBy: { ticketNumber: "desc" },
    });
    const nextTicketNumber = lastTicket ? lastTicket.ticketNumber + 1 : 1;

    // 4. Create the new ticket – if a counter is found, mark as CALLED; otherwise, keep as PENDING.
    const newTicket = await prisma.queueTicket.create({
      data: {
        ticketNumber: nextTicketNumber,
        prefix: service.code,
        status: counter ? QueueStatus.CALLED : QueueStatus.PENDING,
        service: { connect: { id: service.id } },
        ...(counter ? { counter: { connect: { id: counter.id } } } : {}),
      },
    });

    // (Optional) Trigger a display update (e.g. send notification) here

    return NextResponse.json(
      {
        ticketNumber: `${newTicket.prefix}${newTicket.ticketNumber}`,
        status: newTicket.status,
        counterId: counter ? counter.id : null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
