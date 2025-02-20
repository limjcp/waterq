import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { counterCode } = body;
    if (!counterCode) {
      return NextResponse.json(
        { error: "Missing counterCode" },
        { status: 400 }
      );
    }

    // 1. Find the counter
    const counter = await prisma.counter.findUnique({
      where: { code: counterCode },
    });
    if (!counter) {
      return NextResponse.json({ error: "Counter not found" }, { status: 404 });
    }

    // 2. Find the max ticketNumber for that counter
    const lastTicket = await prisma.queueTicket.findFirst({
      where: { counterId: counter.id },
      orderBy: { ticketNumber: "desc" },
    });
    const nextTicketNumber = lastTicket ? lastTicket.ticketNumber + 1 : 1;

    // 3. Create a new ticket
    const newTicket = await prisma.queueTicket.create({
      data: {
        ticketNumber: nextTicketNumber,
        prefix: counter.code,
        counter: {
          connect: { id: counter.id },
        },
      },
    });

    return NextResponse.json(
      { ticketNumber: `${newTicket.prefix}${newTicket.ticketNumber}` },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
