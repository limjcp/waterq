"use client";
import React, { useEffect, useState } from "react";

type Ticket = {
  id: string;
  ticketNumber: number;
  prefix: string;
  status: string;
};

export default function StaffDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [calledTicketId, setCalledTicketId] = useState<string | null>(null);
  const [servingTicketId, setServingTicketId] = useState<string | null>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  async function fetchTickets() {
    const res = await fetch("/api/tickets/list");
    const data = await res.json();
    setTickets(data);
    const calledTicket = data.find(
      (ticket: Ticket) => ticket.status === "CALLED" && ticket.prefix === "NSA"
    );
    setCalledTicketId(calledTicket ? calledTicket.id : null);
    const servingTicket = data.find(
      (ticket: Ticket) => ticket.status === "SERVING" && ticket.prefix === "NSA"
    );
    setServingTicketId(servingTicket ? servingTicket.id : null);
  }

  async function callNextTicket() {
    const nextTicket = tickets.find(
      (ticket) => ticket.status === "PENDING" && ticket.prefix === "NSA"
    );
    if (nextTicket) {
      await fetch(`/api/tickets/${nextTicket.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CALLED" }),
      });
      setCalledTicketId(nextTicket.id);
      fetchTickets();
    }
  }

  async function startServing(ticketId: string) {
    await fetch(`/api/tickets/${ticketId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "SERVING" }),
    });
    setServingTicketId(ticketId);
    fetchTickets();
  }

  async function markServed(ticketId: string) {
    await fetch(`/api/tickets/${ticketId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "SERVED" }),
    });
    setServingTicketId(null);
    setCalledTicketId(null);
    fetchTickets();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-sky-100 p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl p-8">
        <h1 className="text-3xl font-bold text-sky-800 mb-6">
          Staff Dashboard
        </h1>
        <div className="mb-6">
          <button
            onClick={callNextTicket}
            className="bg-sky-500 hover:bg-sky-600 text-white font-medium py-2 px-4 rounded transition-colors"
            disabled={calledTicketId !== null || servingTicketId !== null}
          >
            Call Next Ticket
          </button>
        </div>
        {tickets.length ? (
          tickets
            .filter((ticket) => ticket.prefix === "NSA")
            .map((ticket) => (
              <div
                key={ticket.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between border border-sky-100 p-4 rounded-lg mb-4"
              >
                <div>
                  <p className="text-xl font-semibold text-sky-700">
                    Ticket: {ticket.prefix}
                    {ticket.ticketNumber}
                  </p>
                  <p className="text-sm text-sky-500">
                    Status: {ticket.status}
                  </p>
                </div>
                <div className="mt-4 sm:mt-0">
                  {ticket.status === "CALLED" && (
                    <button
                      onClick={() => startServing(ticket.id)}
                      className="bg-sky-500 hover:bg-sky-600 text-white font-medium py-2 px-4 rounded transition-colors"
                    >
                      Start Serving
                    </button>
                  )}
                  {ticket.status === "SERVING" && (
                    <button
                      onClick={() => markServed(ticket.id)}
                      className="bg-sky-500 hover:bg-sky-600 text-white font-medium py-2 px-4 rounded transition-colors"
                    >
                      Mark as Served
                    </button>
                  )}
                </div>
              </div>
            ))
        ) : (
          <p className="text-center text-sky-600">No tickets available.</p>
        )}
      </div>
    </div>
  );
}
