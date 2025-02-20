"use client";
import React, { useState } from "react";

export default function Kiosk() {
  const [selectedCounterCode, setSelectedCounterCode] = useState("CW");
  const [ticketNumber, setTicketNumber] = useState<number | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ counterCode: selectedCounterCode }),
      });
      const data = await res.json();
      setTicketNumber(data.ticketNumber);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div>
      <h1>Kiosk</h1>
      {ticketNumber ? (
        <div>
          <h2>Your Ticket</h2>
          <p>{ticketNumber}</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <label>Choose a Service:</label>
          <select
            value={selectedCounterCode}
            onChange={(e) => setSelectedCounterCode(e.target.value)}
          >
            <option value="CW">Customer Welfare</option>
            <option value="NSA">New Service Application</option>
            <option value="P">Payment</option>
          </select>
          <button type="submit">Get Ticket</button>
        </form>
      )}
    </div>
  );
}
