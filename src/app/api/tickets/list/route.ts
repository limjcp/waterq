// app/api/tickets/list/route.ts

import { NextResponse } from "next/server";
import { QueueStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const tickets = await prisma.queueTicket.findMany({
      where: {
        status: {
          in: [QueueStatus.PENDING, QueueStatus.CALLED],
        },
      },
      orderBy: {
        createdAt: "asc",
      },
      include: {
        // If you need to fetch related counter info, uncomment below:
        // counter: true,
      },
    });
    return NextResponse.json(tickets);
  } catch (error) {
    console.error(error);
    return new NextResponse("Server error", { status: 500 });
  }
}
