import {
  NextRequest,
  NextResponse,
} from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  // Check authentication
  const session = await auth();
  if (
    !session?.user?.role?.includes("supervisor")
  ) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Get service ID from query parameters
  const searchParams =
    request.nextUrl.searchParams;
  const serviceId = searchParams.get("serviceId");

  if (!serviceId) {
    return NextResponse.json(
      { error: "Service ID is required" },
      { status: 400 }
    );
  }

  try {
    // Verify this user is the supervisor of this service
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        supervisedService: true,
      },
    });

    if (
      !user?.supervisedService ||
      user.supervisedService.id !== serviceId
    ) {
      return NextResponse.json(
        {
          error:
            "You are not authorized to access this service's data",
        },
        { status: 403 }
      );
    }

    // Get service types for this service
    const serviceTypes =
      await prisma.serviceType.findMany({
        where: {
          serviceId: serviceId,
        },
        select: {
          id: true,
          name: true,
          code: true,
        },
      });

    return NextResponse.json(serviceTypes);
  } catch (error) {
    console.error(
      "Error fetching service types:",
      error
    );
    return NextResponse.json(
      { error: "Failed to fetch service types" },
      { status: 500 }
    );
  }
}
