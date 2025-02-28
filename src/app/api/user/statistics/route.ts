import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { auth } from "@/auth";

export async function GET(request: Request) {
  try {
    // Get the session
    const session = await auth();
    if (!session || !session.user) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get username from query parameters
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    if (!username) {
      return new NextResponse(
        JSON.stringify({ error: "Username is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        assignedCounter: true,
      },
    });

    if (!user) {
      return new NextResponse(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get the counter ID for the user
    const counterId = user.assignedCounter?.id;

    if (!counterId) {
      return new NextResponse(
        JSON.stringify({
          totalServed: 0,
          todayServed: 0,
          averageServiceTime: 0,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get total served tickets for this counter
    // Note: Since servedById doesn't exist in the schema, counting all tickets served at this counter
    const totalServed = await prisma.queueTicket.count({
      where: {
        counterId,
        status: "SERVED",
      },
    });

    // Get today's served tickets count
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayServed = await prisma.queueTicket.count({
      where: {
        counterId,
        status: "SERVED",
        updatedAt: {
          gte: today,
        },
      },
    });

    // Calculate average service time for tickets at this counter
    const ticketsWithTime = await prisma.queueTicket.findMany({
      where: {
        counterId,
        status: "SERVED",
        servingStart: { not: null },
        servingEnd: { not: null },
      },
      select: {
        servingStart: true,
        servingEnd: true,
      },
    });

    let averageServiceTime = 0;

    if (ticketsWithTime.length > 0) {
      const totalServiceTime = ticketsWithTime.reduce((acc, ticket) => {
        if (ticket.servingStart && ticket.servingEnd) {
          const serviceDuration = Math.floor(
            (ticket.servingEnd.getTime() - ticket.servingStart.getTime()) / 1000
          );
          return acc + serviceDuration;
        }
        return acc;
      }, 0);

      averageServiceTime = Math.round(
        totalServiceTime / ticketsWithTime.length
      );
    }

    return new NextResponse(
      JSON.stringify({
        totalServed,
        todayServed,
        averageServiceTime,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching user statistics:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
