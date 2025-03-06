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

// Add DELETE handler
export async function DELETE(request: Request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const url = new URL(request.url);
    const serviceId = url.searchParams.get("serviceId");
    const typeId = url.searchParams.get("typeId");

    // Validate parameters
    if (!serviceId || !typeId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Check if service type exists and belongs to the specified service
    const serviceType = await prisma.serviceType.findFirst({
      where: {
        id: typeId,
        serviceId: serviceId,
      },
    });

    if (!serviceType) {
      return NextResponse.json(
        {
          error:
            "Service type not found or doesn't belong to the specified service",
        },
        { status: 404 }
      );
    }

    // Delete the service type
    await prisma.serviceType.delete({
      where: { id: typeId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting service type:", error);
    return NextResponse.json(
      { error: "Failed to delete service type" },
      { status: 500 }
    );
  }
}
