// /pages/api/tickets.ts (Pages Router example)
import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { counterCode } = req.body;
    if (!counterCode) {
      return res.status(400).json({ error: "Missing counterCode" });
    }

    try {
      // 1. Find the counter
      const counter = await prisma.counter.findUnique({
        where: { code: counterCode },
      });
      if (!counter) {
        return res.status(404).json({ error: "Counter not found" });
      }

      // 2. Find the max ticketNumber for that counter
      const lastTicket = await prisma.queueTicket.findFirst({
        where: { counterId: counter.id },
        orderBy: { ticketNumber: "desc" },
      });
      const nextTicketNumber = lastTicket ? lastTicket.ticketNumber + 1 : 1;

      // 3. Create a new ticket
      const newTicket = await prisma.queueTicket.create({
        data: {
          ticketNumber: nextTicketNumber,
          prefix: counter.code,
          counter: {
            connect: { id: counter.id },
          },
        },
      });

      // (Optional) Broadcast real-time event with Pusher/Socket.IO

      return res.status(200).json({
        ticketNumber: `${newTicket.prefix}${newTicket.ticketNumber}`,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Server error" });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}
