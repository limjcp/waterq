import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  try {
    const counter = await prisma.counter.findUnique({
      where: { id },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!counter) {
      return NextResponse.json({ error: "Counter not found" }, { status: 404 });
    }

    return NextResponse.json(counter);
  } catch (error) {
    console.error("Error fetching counter:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
