import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { serviceId, name, code } = body;

    // Validate input
    if (!serviceId || !name || !code) {
      return NextResponse.json(
        { error: "Missing required fields" },
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

    // Check if code is unique
    const existingType = await prisma.serviceType.findUnique({
      where: { code },
    });

    if (existingType) {
      return NextResponse.json(
        { error: "Service type code already exists" },
        { status: 400 }
      );
    }

    // Create new service type
    const serviceType = await prisma.serviceType.create({
      data: {
        name,
        code,
        serviceId,
      },
    });

    return NextResponse.json(serviceType);
  } catch (error) {
    console.error("Error creating service type:", error);
    return NextResponse.json(
      { error: "Failed to create service type" },
      { status: 500 }
    );
  }
}
