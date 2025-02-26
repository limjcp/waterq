import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { QueueStatus } from "@prisma/client";

export async function GET(
  request: Request,
  { params }: { params: { counterId: string } }
) {
  const { counterId } = await params;

  try {
    // First get the counter details
    const counter = await prisma.counter.findUnique({
      where: { id: counterId },
      select: {
        id: true,
        name: true,
        code: true,
      },
    });

    if (!counter) {
      return NextResponse.json({ error: "Counter not found" }, { status: 404 });
    }

    // Find the most recent ticket that is CALLED for the given counter.
    const ticket = await prisma.queueTicket.findFirst({
      where: {
        counterId,
        status: { in: [QueueStatus.CALLED, QueueStatus.SERVING] },
      },
      orderBy: { updatedAt: "desc" },
      include: { service: true },
    });

    // Return both counter and ticket details
    return NextResponse.json({
      counter,
      ticket,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
