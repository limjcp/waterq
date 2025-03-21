import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      select: {
        id: true,
        name: true,
        code: true,
      },
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.code) {
      return NextResponse.json(
        { error: "Service name and code are required" },
        { status: 400 }
      );
    }

    // Check if service with same code already exists
    const existingService = await prisma.service.findFirst({
      where: {
        code: body.code,
      },
    });

    if (existingService) {
      return NextResponse.json(
        { error: "A service with this code already exists" },
        { status: 400 }
      );
    }

    // Create new service
    const newService = await prisma.service.create({
      data: {
        name: body.name,
        code: body.code,
      },
    });

    return NextResponse.json(newService, { status: 201 });
  } catch (error) {
    console.error("Error creating service:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
