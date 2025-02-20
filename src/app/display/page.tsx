// /pages/display/index.tsx
import React, { useEffect, useState } from "react";

type DisplayCounter = {
  id: string;
  name: string;
  code: string;
  currentTicket?: string; // e.g. "CW12"
};

export default function DisplayBoard() {
  const [counters, setCounters] = useState<DisplayCounter[]>([]);

  useEffect(() => {
    fetchCounters();
    const interval = setInterval(fetchCounters, 5000); // poll every 5s
    return () => clearInterval(interval);
  }, []);

  async function fetchCounters() {
    const res = await fetch("/api/display");
    const data = await res.json();
    setCounters(data);
  }

  return (
    <div>
      <h1>Now Serving</h1>
      <div style={{ display: "flex", gap: "2rem" }}>
        {counters.map((c) => (
          <div key={c.id} style={{ border: "1px solid #ccc", padding: "1rem" }}>
            <h2>{c.name}</h2>
            <p>{c.currentTicket || "No ticket called yet"}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
