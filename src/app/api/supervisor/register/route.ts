import {
  NextRequest,
  NextResponse,
} from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
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

  try {
    const data = await request.json();
    const {
      firstName,
      middleName,
      lastName,
      email,
      username,
      password,
      serviceId,
    } = data;

    // Validate required fields
    if (
      !firstName ||
      !lastName ||
      !email ||
      !username ||
      !password ||
      !serviceId
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

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

    // Check if username or email already exists
    const existingUser =
      await prisma.user.findFirst({
        where: {
          OR: [{ username }, { email }],
        },
      });

    if (existingUser) {
      return NextResponse.json(
        {
          error:
            "Username or email already exists",
        },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    // Create user with staff role
    const newUser = await prisma.user.create({
      data: {
        firstName,
        middleName,
        lastName,
        email,
        username,
        password: hashedPassword,
        role: ["staff"],
      },
    });

    return NextResponse.json({
      message: "User registered successfully",
      userId: newUser.id,
    });
  } catch (error) {
    console.error(
      "Error registering user:",
      error
    );
    return NextResponse.json(
      { error: "Failed to register user" },
      { status: 500 }
    );
  }
}
