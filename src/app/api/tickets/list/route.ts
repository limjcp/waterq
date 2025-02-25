// app/api/tickets/list/route.ts

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
          ],
        },
      },
      orderBy: [
        { isPrioritized: "desc" }, // Prioritized tickets come first.
        { createdAt: "asc" }, // Then sorted by creation time.
      ],
      include: {
        // Include any related fields if needed.
      },
    });
    return NextResponse.json(tickets);
  } catch (error) {
    console.error(error);
    return new NextResponse("Server error", { status: 500 });
  }
}
