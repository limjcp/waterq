import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      include: {
        assignedCounter: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        supervisedService: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });
    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
