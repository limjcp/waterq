import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const counters = await prisma.counter.findMany({
      include: {
        service: true,
        User: true,
      },
    });
    return NextResponse.json(counters);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
