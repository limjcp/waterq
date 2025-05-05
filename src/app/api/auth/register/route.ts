import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const {
      firstName,
      middleName,
      lastName,
      email,
      username,
      password,
      role,
      serviceId, // Add serviceId to handle supervisor assignment
    } = await request.json();

    // Check if user exists by email or username.
    const existingUser =
      await prisma.user.findFirst({
        where: { OR: [{ email }, { username }] },
      });
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // For supervisors, check if service exists and is not already supervised
    if (role === "supervisor" && serviceId) {
      // Check if service exists
      const service =
        await prisma.service.findUnique({
          where: { id: serviceId },
          include: { supervisor: true },
        });

      if (!service) {
        return NextResponse.json(
          {
            error:
              "Selected service does not exist",
          },
          { status: 400 }
        );
      }

      // Check if service already has a supervisor
      if (service.supervisor) {
        return NextResponse.json(
          {
            error:
              "This service already has a supervisor assigned",
          },
          { status: 400 }
        );
      }
    }

    // Hash the password with bcryptjs.
    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    // Create the new user with a transaction to ensure supervisor assignment is atomic
    const user = await prisma.$transaction(
      async (tx) => {
        // Create the user first
        const newUser = await tx.user.create({
          data: {
            firstName,
            middleName,
            lastName,
            email,
            username,
            password: hashedPassword,
            role: role ? [role] : ["admin"],
          },
        });

        // If the user is a supervisor, assign them to the service
        if (role === "supervisor" && serviceId) {
          await tx.service.update({
            where: { id: serviceId },
            data: { supervisorId: newUser.id },
          });
        }

        return newUser;
      }
    );

    return NextResponse.json(
      {
        message: "User registered successfully",
        user,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
