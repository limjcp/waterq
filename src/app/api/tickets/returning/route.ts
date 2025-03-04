import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { QueueStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const serviceId = searchParams.get("serviceId");

    if (!serviceId) {
      return NextResponse.json(
        { error: "Service ID is required" },
        { status: 400 }
      );
    }

    const returningTickets = await prisma.queueTicket.findMany({
      where: {
        serviceId: serviceId,
        status: QueueStatus.RETURNING,
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: [{ isPrioritized: "desc" }, { createdAt: "asc" }],
    });

    return NextResponse.json(returningTickets);
  } catch (error) {
    console.error("Error fetching returning tickets:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
