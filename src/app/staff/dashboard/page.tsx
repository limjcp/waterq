// /pages/staff/dashboard.tsx
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type Ticket = {
  id: string;
  ticketNumber: number;
  prefix: string;
  status: string;
};

export default function StaffDashboard() {
  const { data: session } = useSession();
  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    fetchTickets();
  }, []);

  async function fetchTickets() {
    const res = await fetch("/api/tickets/list");
    const data = await res.json();
    setTickets(data);
  }

  async function callTicket(ticketId: string) {
    await fetch(`/api/tickets/${ticketId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CALLED" }),
    });
    fetchTickets();
  }

  async function markServed(ticketId: string) {
    await fetch(`/api/tickets/${ticketId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "SERVED" }),
    });
    fetchTickets();
  }

  return (
    <div>
      <h1>Staff Dashboard</h1>
      {tickets.map((t) => (
        <div key={t.id} style={{ marginBottom: "1rem" }}>
          <span>
            Ticket: {t.prefix}
            {t.ticketNumber} - Status: {t.status}
          </span>
          {t.status === "PENDING" && (
            <button onClick={() => callTicket(t.id)}>Call</button>
          )}
          {t.status === "CALLED" && (
            <button onClick={() => markServed(t.id)}>Mark as Served</button>
          )}
        </div>
      ))}
    </div>
  );
}
