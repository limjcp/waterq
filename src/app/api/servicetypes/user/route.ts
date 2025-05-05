import {
  NextRequest,
  NextResponse,
} from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  try {
    // Get the current authenticated user
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the username from query params or use the current user's username
    const username = session.user.username;

    // Get user with their assigned counter and service
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        assignedCounter: {
          include: {
            service: true,
          },
        },
      },
    });
    if (!user) {
      // Even if user is not found, return an empty array instead of an error
      // This way the frontend won't crash and will just show "No service types available"
      return NextResponse.json([]);
    }

    // If user is assigned to a counter, filter service types by that counter's service
    let serviceTypes;

    if (user.assignedCounter) {
      const serviceId =
        user.assignedCounter.serviceId;

      // Get service types for this specific service
      serviceTypes =
        await prisma.serviceType.findMany({
          where: {
            serviceId: serviceId,
          },
          include: {
            service: {
              select: {
                name: true,
                code: true,
              },
            },
          },
          orderBy: {
            name: "asc",
          },
        });
    } else {
      // If user isn't assigned to a counter, return all service types
      // This could be admin or unassigned users
      serviceTypes =
        await prisma.serviceType.findMany({
          include: {
            service: {
              select: {
                name: true,
                code: true,
              },
            },
          },
          orderBy: {
            name: "asc",
          },
        });
    }

    return NextResponse.json(
      serviceTypes.map((type) => ({
        id: type.id,
        name: type.name,
        code: type.code,
        serviceId: type.serviceId,
        serviceName: type.service
          ? type.service.name
          : "Unknown Service",
      }))
    );
  } catch (error) {
    console.error(
      "Error fetching service types for user:",
      error
    );
    return NextResponse.json(
      { error: "Failed to fetch service types" },
      { status: 500 }
    );
  }
}
