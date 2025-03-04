import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const serviceId = searchParams.get("serviceId");

  if (!serviceId) {
    return NextResponse.json(
      { error: "Service ID is required" },
      { status: 400 }
    );
  }

  try {
    const serviceTypes = await prisma.serviceType.findMany({
      where: {
        serviceId: serviceId,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(serviceTypes);
  } catch (error) {
    console.error("Error fetching service types:", error);
    return NextResponse.json(
      { error: "Failed to fetch service types" },
      { status: 500 }
    );
  }
}
