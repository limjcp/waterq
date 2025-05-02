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
    const { serviceId } = data;

    if (!serviceId) {
      return NextResponse.json(
        { error: "Service ID is required" },
        { status: 400 }
      );
    }

    // Remove supervisor from service
    const updatedService =
      await prisma.service.update({
        where: { id: serviceId },
        data: {
          supervisorId: null,
        },
      });

    return NextResponse.json(updatedService);
  } catch (error) {
    console.error(
      "Error removing supervisor:",
      error
    );
    return NextResponse.json(
      { error: "Failed to remove supervisor" },
      { status: 500 }
    );
  }
}
