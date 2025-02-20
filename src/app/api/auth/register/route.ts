import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { firstName, middleName, lastName, email, username, password, role } =
      await request.json();

    // Check if user exists by email or username.
    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Hash the password with bcryptjs.
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new user.
    const user = await prisma.user.create({
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

    return NextResponse.json(
      { message: "User registered successfully", user },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
