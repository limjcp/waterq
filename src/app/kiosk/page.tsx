"use client";
import React, { useState } from "react";
import { TicketIcon } from "@heroicons/react/24/outline";

export default function Kiosk() {
  const [selectedCounterCode, setSelectedCounterCode] = useState("CW");
  const [ticketNumber, setTicketNumber] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-sky-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 transition-all duration-300 hover:shadow-3xl">
        <div className="text-center mb-8">
          <div className="animate-bounce">
            <TicketIcon className="h-14 w-14 text-sky-500 mx-auto mb-4" />
          </div>
          <h1 className="text-3xl font-bold text-sky-800 mb-2">
            Service Kiosk
          </h1>
          <p className="text-sky-600">Get your digital queue ticket</p>
        </div>

        {ticketNumber ? (
          <div className="text-center space-y-6 animate-fade-in">
            <div className="bg-sky-50 rounded-xl p-6 border border-sky-100">
              <h2 className="text-sm font-semibold text-sky-600 mb-2">
                YOUR TICKET NUMBER
              </h2>
              <div className="text-5xl font-bold text-sky-800 animate-pop-in">
                {ticketNumber}
              </div>
              <div className="mt-3 inline-flex items-center px-4 py-1 bg-sky-500 text-white rounded-full text-sm font-medium animate-fade-in">
                {selectedCounterCode}
              </div>
            </div>
            <button
              onClick={() => setTicketNumber(null)}
              className="w-full bg-sky-500 hover:bg-sky-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
            >
              Get Another Ticket
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-sky-700 mb-2">
                Choose Service Type
              </label>
              <select
                value={selectedCounterCode}
                onChange={(e) => setSelectedCounterCode(e.target.value)}
                className="w-full px-4 py-3 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white"
              >
                <option value="CW">Customer Welfare</option>
                <option value="NSA">New Service Application</option>
                <option value="P">Payment</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-sky-500 hover:bg-sky-600 text-white font-medium py-3 px-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
            >
              {isLoading ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                <>
                  <TicketIcon className="w-5 h-5 mr-2" />
                  Generate Ticket
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
