"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type DisplayCounter = {
  id: string;
  name: string;
  code: string;
  currentTicket?: string; // e.g. "CW12"
};

export default function DisplayBoard() {
  const [counters, setCounters] = useState<DisplayCounter[]>([]);
  const [selectedCounterId, setSelectedCounterId] = useState<string>("");
  const router = useRouter();

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

  // Filter counters if one is selected
  const displayedCounters =
    selectedCounterId === ""
      ? counters
      : counters.filter((c) => c.id === selectedCounterId);

  return (
    <div className="min-h-screen bg-sky-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-6xl">
        <h1 className="text-4xl font-bold text-sky-800 mb-8 text-center">
          Now Serving
        </h1>

        <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-center">
          <select
            value={selectedCounterId}
            onChange={(e) => setSelectedCounterId(e.target.value)}
            className="px-4 py-2 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white"
          >
            <option value="">All Counters</option>
            {counters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {selectedCounterId && (
            <button
              onClick={() => setSelectedCounterId("")}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition"
            >
              Clear Filter
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedCounters.map((c) => (
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
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => router.push(`/display/${c.id}`)}
                  className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition"
                >
                  View Display
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
