import { NextResponse } from "next/server";
import { getSocketIO } from "@/lib/socket-singleton";

// This endpoint won't actually be called by Socket.IO clients,
// it's just to ensure our socket.io instance is initialized
export async function GET() {
  // Make sure socket server is initialized
  getSocketIO();
  return NextResponse.json({ ok: true });
}
