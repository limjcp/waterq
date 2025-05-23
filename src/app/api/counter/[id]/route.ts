import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = await context.params;

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

export async function PUT(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = await context.params;
  const data = await request.json();

  try {
    const counter = await prisma.counter.update({
      where: { id },
      data: {
        name: data.name,
        code: data.code,
        serviceId: data.serviceId,
      },
      include: {
        service: true,
      },
    });

    return NextResponse.json(counter);
  } catch (error: any) {
    console.error("Error updating counter:", error);
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Counter code must be unique" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to update counter" },
      { status: 500 }
    );
  }
}
