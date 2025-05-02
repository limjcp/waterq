import {
  NextRequest,
  NextResponse,
} from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  // Check authentication
  const session = await auth();
  if (!session?.user?.role?.includes("admin")) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const data = await request.json();
    const { userId, serviceId } = data;

    if (!userId || !serviceId) {
      return NextResponse.json(
        {
          error:
            "User ID and Service ID are required",
        },
        { status: 400 }
      );
    }

    // Check if service already has a supervisor
    const existingService =
      await prisma.service.findUnique({
        where: { id: serviceId },
        select: { supervisorId: true },
      });

    if (
      existingService?.supervisorId &&
      existingService.supervisorId !== userId
    ) {
      return NextResponse.json(
        {
          error:
            "This service already has a supervisor assigned",
        },
        { status: 400 }
      );
    }

    // Update user role if needed
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user?.role.includes("supervisor")) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          role: [...user.role, "supervisor"],
        },
      });
    }

    // Assign supervisor to service
    const updatedService =
      await prisma.service.update({
        where: { id: serviceId },
        data: {
          supervisorId: userId,
        },
        include: {
          supervisor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

    return NextResponse.json(updatedService);
  } catch (error) {
    console.error(
      "Error assigning supervisor:",
      error
    );
    return NextResponse.json(
      { error: "Failed to assign supervisor" },
      { status: 500 }
    );
  }
}
