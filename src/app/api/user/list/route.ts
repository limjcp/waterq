import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@prisma/client";

export async function GET(request: NextRequest) {
  // Check authentication
  const session = await auth();
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Extract query parameters
  const searchParams = request.nextUrl.searchParams;
  const roleParam = searchParams.get("role");

  if (!roleParam) {
    return NextResponse.json(
      { error: "Role parameter is required" },
      { status: 400 }
    );
  }

  try {
    // Convert the role parameter to lowercase to match the Prisma enum
    const role = roleParam.toLowerCase() as Role;

    // Get users with specified role
    const users = await prisma.user.findMany({
      where: {
        role: {
          has: role,
        },
      },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
      },
      orderBy: {
        firstName: "asc",
      },
    });

    // Format the response
    const formattedUsers = users.map((user) => ({
      id: user.id,
      username: user.username,
      name: `${user.firstName} ${user.lastName || ""}`.trim(),
    }));

    return NextResponse.json(formattedUsers);
  } catch (error) {
    console.error("Error fetching users by role:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
