import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const counters = await prisma.counter.findMany();

    const results = await Promise.all(
      counters.map(async (counter) => {
        // find the last called ticket for this counter
        const lastCalled = await prisma.queueTicket.findFirst({
          where: {
            counterId: counter.id,
            status: {
              in: ["CALLED", "SERVING"],
            },
          },
          orderBy: {
            updatedAt: "desc",
          },
        });

        return {
          id: counter.id,
          name: counter.name,
          code: counter.code,
          currentTicket: lastCalled
            ? `${lastCalled.prefix}${lastCalled.ticketNumber}`
            : null,
        };
      })
    );

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
