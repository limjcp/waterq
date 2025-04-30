import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get all counters
    const counters = await prisma.counter.findMany();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get statistics for each counter
    const stats = await Promise.all(
      counters.map(async (counter) => {
        // Get total served tickets for this counter
        const totalServed = await prisma.queueTicket.count({
          where: {
            counterId: counter.id,
            status: "SERVED",
          },
        });

        // Get today's served tickets count
        const todayServed = await prisma.queueTicket.count({
          where: {
            counterId: counter.id,
            status: "SERVED",
            updatedAt: {
              gte: today,
            },
          },
        });

        // Calculate all-time average service time
        const allTimeTicketsWithTime = await prisma.queueTicket.findMany({
          where: {
            counterId: counter.id,
            status: "SERVED",
            servingStart: { not: null },
            servingEnd: { not: null },
          },
          select: {
            servingStart: true,
            servingEnd: true,
          },
        });

        // Calculate today's average service time
        const todayTicketsWithTime = await prisma.queueTicket.findMany({
          where: {
            counterId: counter.id,
            status: "SERVED",
            servingStart: { not: null },
            servingEnd: { not: null },
            updatedAt: {
              gte: today,
            },
          },
          select: {
            servingStart: true,
            servingEnd: true,
          },
        });

        let averageServiceTime = 0;
        if (allTimeTicketsWithTime.length > 0) {
          const totalServiceTime = allTimeTicketsWithTime.reduce((acc, ticket) => {
            if (ticket.servingStart && ticket.servingEnd) {
              const serviceDuration = Math.floor(
                (ticket.servingEnd.getTime() - ticket.servingStart.getTime()) / 1000
              );
              return acc + serviceDuration;
            }
            return acc;
          }, 0);
          averageServiceTime = Math.round(totalServiceTime / allTimeTicketsWithTime.length);
        }

        let todayAverageServiceTime = 0;
        if (todayTicketsWithTime.length > 0) {
          const todayTotalServiceTime = todayTicketsWithTime.reduce((acc, ticket) => {
            if (ticket.servingStart && ticket.servingEnd) {
              const serviceDuration = Math.floor(
                (ticket.servingEnd.getTime() - ticket.servingStart.getTime()) / 1000
              );
              return acc + serviceDuration;
            }
            return acc;
          }, 0);
          todayAverageServiceTime = Math.round(todayTotalServiceTime / todayTicketsWithTime.length);
        }

        return {
          id: counter.id,
          name: counter.name,
          totalServed,
          todayServed,
          averageServiceTime,
          todayAverageServiceTime,
        };
      })
    );

    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Error fetching counter statistics:', error);
    return NextResponse.json(
      { error: "Failed to fetch counter statistics" },
      { status: 500 }
    );
  }
}