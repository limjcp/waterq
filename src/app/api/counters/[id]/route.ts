import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

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

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  const { id } = await context.params;

  try {
    await prisma.counter.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Counter deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting counter:", error);
    if (error.code === "P2003") {
      return NextResponse.json(
        { error: "Cannot delete counter that has users or tickets assigned" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to delete counter" },
      { status: 500 }
    );
  }
}
