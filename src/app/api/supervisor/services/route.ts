import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  // Check authentication
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    // Fetch the user with their supervised service
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        supervisedService: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user has supervisor role
    if (!user.role.includes("supervisor")) {
      return NextResponse.json(
        { error: "User is not a supervisor" },
        { status: 403 }
      );
    }

    if (!user.supervisedService) {
      return NextResponse.json(null);
    }

    return NextResponse.json(
      user.supervisedService
    );
  } catch (error) {
    console.error(
      "Error fetching supervised service:",
      error
    );
    return NextResponse.json(
      {
        error:
          "Failed to fetch supervised service",
      },
      { status: 500 }
    );
  }
}
