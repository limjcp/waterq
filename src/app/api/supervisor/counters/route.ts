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
            "You are not authorized to manage this service",
        },
        { status: 403 }
      );
    }

    // Get counters for this service
    const counters =
      await prisma.counter.findMany({
        where: {
          serviceId: serviceId,
        },
        select: {
          id: true,
          name: true,
          code: true,
        },
      });

    return NextResponse.json(counters);
  } catch (error) {
    console.error(
      "Error fetching counters:",
      error
    );
    return NextResponse.json(
      { error: "Failed to fetch counters" },
      { status: 500 }
    );
  }
}
