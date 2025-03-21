import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const counters = await prisma.counter.findMany({
      include: {
        service: true,
        User: true,
      },
    });
    return NextResponse.json(counters);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { name, code, serviceId } = body;

    // Validate required fields
    if (!name || !code || !serviceId) {
      return NextResponse.json(
        { error: "Name, code, and serviceId are required" },
        { status: 400 }
      );
    }

    // Check if service exists
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Create the counter
    const counter = await prisma.counter.create({
      data: {
        name,
        code,
        serviceId,
      },
    });

    return NextResponse.json(counter);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
