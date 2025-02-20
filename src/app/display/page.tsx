"use client";
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
    <div className="min-h-screen bg-sky-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-6xl">
        <h1 className="text-4xl font-bold text-sky-800 mb-8 text-center">
          Now Serving
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {counters.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
            >
              <h2 className="text-xl font-semibold text-sky-700 mb-4">
                {c.name}
              </h2>
              <div className="flex items-center justify-center bg-sky-50 rounded-lg p-4">
                <p className="text-3xl font-bold text-sky-800">
                  {c.currentTicket || "---"}
                </p>
              </div>
              <p className="text-sm text-sky-600 mt-2 text-center">
                {c.currentTicket ? "Currently Serving" : "No ticket called yet"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
