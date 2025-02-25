import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const username = searchParams.get("username");

  if (!username) {
    return NextResponse.json(
      { error: "Username is required" },
      { status: 400 }
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        assignedCounterId: true,
        assignedCounter: {
          select: {
            id: true,
            name: true,
            code: true,
            serviceId: true,
            service: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      assignedCounterId: user.assignedCounterId,
      assignedCounter: user.assignedCounter,
    });
  } catch (error) {
    console.error("Error fetching user counter:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
