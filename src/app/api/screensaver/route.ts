import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const images = await prisma.screensaverImage.findMany({
      orderBy: { order: 'asc' }
    });
    return NextResponse.json(images);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const image = await prisma.screensaverImage.create({
      data: {
        title: data.title,
        imageUrl: data.imageUrl,
        order: data.order || 0,
      }
    });
    return NextResponse.json(image);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create image" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const data = await req.json();
    const image = await prisma.screensaverImage.update({
      where: { id: data.id },
      data: {
        title: data.title,
        imageUrl: data.imageUrl,
        isActive: data.isActive,
        order: data.order,
      }
    });
    return NextResponse.json(image);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update image" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) throw new Error("ID is required");
    
    await prisma.screensaverImage.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete image" }, { status: 500 });
  }
}
