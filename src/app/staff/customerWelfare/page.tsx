"use client";
import React, { useEffect, useState } from "react";

type Ticket = {
  id: string;
  ticketNumber: number;
  prefix: string;
  status: string;
  isPrioritized: boolean;
  createdAt: string;
};

export default function StaffDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [calledTicketId, setCalledTicketId] = useState<string | null>(null);
  const [servingTicketId, setServingTicketId] = useState<string | null>(null);
  const [, setLapsedTicketId] = useState<string | null>(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  async function fetchTickets() {
    const res = await fetch("/api/tickets/list");
    const data = await res.json();
    // data is already ordered from the API,
    // but ensure ordering locally: prioritized first, then by creation time
    const sortedTickets = data.sort((a: Ticket, b: Ticket) => {
      if (a.isPrioritized === b.isPrioritized) {
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      }
      return b.isPrioritized ? 1 : -1;
    });
    setTickets(sortedTickets);
    const calledTicket = sortedTickets.find(
      (ticket: Ticket) => ticket.status === "CALLED" && ticket.prefix === "CW"
    );
    setCalledTicketId(calledTicket ? calledTicket.id : null);
    const servingTicket = sortedTickets.find(
      (ticket: Ticket) => ticket.status === "SERVING" && ticket.prefix === "CW"
    );
    setServingTicketId(servingTicket ? servingTicket.id : null);
    const lapsedTicket = sortedTickets.find(
      (ticket: Ticket) => ticket.status === "LAPSED" && ticket.prefix === "CW"
    );
    setLapsedTicketId(lapsedTicket ? lapsedTicket.id : null);
  }

  async function callNextTicket() {
    const nextTicket = tickets.find(
      (ticket) => ticket.status === "PENDING" && ticket.prefix === "CW"
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

  async function markLapsed(ticketId: string) {
    await fetch(`/api/tickets/${ticketId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "LAPSED" }),
    });
    fetchTickets();
  }

  async function recallTicket(ticketId: string) {
    await fetch(`/api/tickets/${ticketId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CALLED" }),
    });
    fetchTickets();
  }

  // Filter active tickets (priority is implicit in ordering)
  const activeTickets = tickets.filter(
    (ticket) =>
      ticket.prefix === "CW" &&
      ["PENDING", "CALLED", "SERVING"].includes(ticket.status)
  );

  const lapsedTickets = tickets.filter(
    (ticket) => ticket.status === "LAPSED" && ticket.prefix === "CW"
  );

  // Disable if a ticket is already in CALLED or SERVING
  const isAnyActive = calledTicketId !== null || servingTicketId !== null;

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
            disabled={isAnyActive}
          >
            Call Next Ticket
          </button>
        </div>

        {/* Active Tickets */}
        {activeTickets.length ? (
          activeTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between border border-sky-100 p-4 rounded-lg mb-4"
            >
              <div>
                <p className="text-xl font-semibold text-sky-700">
                  Ticket: {ticket.prefix}
                  {ticket.ticketNumber}
                  {ticket.isPrioritized && " (PWD)"}
                </p>
                <p className="text-sm text-sky-500">Status: {ticket.status}</p>
              </div>
              <div className="mt-4 sm:mt-0">
                {ticket.status === "CALLED" && (
                  <>
                    <button
                      onClick={() => startServing(ticket.id)}
                      className="bg-sky-500 hover:bg-sky-600 text-white font-medium py-2 px-4 rounded transition-colors mr-2"
                    >
                      Start Serving
                    </button>
                    <button
                      onClick={() => markLapsed(ticket.id)}
                      className="bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 px-4 rounded transition-colors"
                    >
                      Mark as Lapsed
                    </button>
                  </>
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
          <p className="text-center text-sky-600">
            No active tickets available.
          </p>
        )}

        {/* Lapsed Tickets Section */}
        <h2 className="text-2xl font-bold text-sky-800 mt-8 mb-4">
          Lapsed Tickets
        </h2>
        {lapsedTickets.length ? (
          lapsedTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between border border-amber-100 p-4 rounded-lg mb-4"
            >
              <div>
                <p className="text-xl font-semibold text-amber-700">
                  Ticket: {ticket.prefix}
                  {ticket.ticketNumber}
                </p>
                <p className="text-sm text-amber-500">
                  Status: {ticket.status}
                </p>
              </div>
              <div className="mt-4 sm:mt-0">
                <button
                  onClick={() => recallTicket(ticket.id)}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 px-4 rounded transition-colors"
                  disabled={calledTicketId !== null || servingTicketId !== null}
                >
                  Recall Ticket
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center text-amber-600">No lapsed tickets.</p>
        )}
      </div>
    </div>
  );
}
