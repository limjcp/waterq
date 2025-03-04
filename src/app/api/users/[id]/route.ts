import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET a single user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return new NextResponse(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error(error);
    return new NextResponse("Server error", { status: 500 });
  }
}

// Update a user's password or assigned counter via PUT
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    const { password, assignedCounterId } = await request.json();

    const data: any = {};
    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }
    if (assignedCounterId) {
      data.assignedCounterId = assignedCounterId;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error(error);
    return new NextResponse("Server error", { status: 500 });
  }
}

// Archive a user via DELETE
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  try {
    await prisma.user.update({
      where: { id },
      data: { role: ["archived"] },
    });

    return new NextResponse("User archived successfully", { status: 200 });
  } catch (error) {
    console.error(error);
    return new NextResponse("Server error", { status: 500 });
  }
}
