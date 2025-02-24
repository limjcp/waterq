import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { QueueStatus } from "@prisma/client";

export async function GET(
  request: Request,
  { params }: { params: { counterId: string } }
) {
  const { counterId } = params;

  try {
    // Find the most recent ticket that is CALLED for the given counter.
    const ticket = await prisma.queueTicket.findFirst({
      where: { counterId, status: QueueStatus.CALLED },
      orderBy: { updatedAt: "desc" },
      include: { service: true },
    });

    return NextResponse.json(ticket);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
