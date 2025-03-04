import { NextResponse } from "next/server";
import { QueueStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const tickets = await prisma.queueTicket.findMany({
      where: {
        status: {
          in: [
            QueueStatus.PENDING,
            QueueStatus.SERVING,
            QueueStatus.CALLED,
            QueueStatus.LAPSED,
            QueueStatus.RETURNING,
          ],
        },
      },
      orderBy: [
        { isPrioritized: "desc" }, // Prioritized tickets come first
        { createdAt: "asc" }, // Then sorted by creation time
      ],
      include: {
        service: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        counter: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });
    return NextResponse.json(tickets);
  } catch (error) {
    console.error(error);
    return new NextResponse("Server error", { status: 500 });
  }
}
