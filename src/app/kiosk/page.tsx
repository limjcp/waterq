"use client";
import React, { useState, useEffect } from "react";
import { TicketIcon } from "@heroicons/react/24/outline";

type TicketResponse = {
  ticketNumber: string;
  status: string;
  counterId: string | null;
  counterName: string | null;
  isPrioritized: boolean;
};

export default function Kiosk() {
  const [selectedCounterCode, setSelectedCounterCode] = useState("CW");
  const [ticketData, setTicketData] = useState<TicketResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPWD, setIsPWD] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Extract the actual service code without the PWD prefix
    const serviceCode = isPWD
      ? selectedCounterCode.replace("PWD-", "")
      : selectedCounterCode;

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceCode,
          isPrioritized: isPWD,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to generate ticket");
      }

      const data = await res.json();
      setTicketData(data);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to generate ticket"
      );
    } finally {
      setIsLoading(false);
    }
  }

  function resetForm() {
    setTicketData(null);
    setError(null);
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

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 text-center">
            <p>{error}</p>
            <button onClick={resetForm} className="mt-2 text-red-600 underline">
              Try again
            </button>
          </div>
        )}

        {ticketData ? (
          <div className="text-center space-y-6 animate-fade-in">
            <div className="bg-sky-50 rounded-xl p-6 border border-sky-100">
              <h2 className="text-sm font-semibold text-sky-600 mb-2">
                YOUR TICKET NUMBER
              </h2>
              <div className="text-5xl font-bold text-sky-800 animate-pop-in">
                {ticketData.ticketNumber}
              </div>

              <div className="mt-3 inline-flex items-center px-4 py-1 bg-sky-500 text-white rounded-full text-sm font-medium animate-fade-in">
                {ticketData.isPrioritized
                  ? `PWD - ${ticketData.ticketNumber.slice(0, -1)}`
                  : ticketData.ticketNumber.slice(0, -1)}
              </div>

              {ticketData.counterName && (
                <div className="mt-4 text-sky-700">
                  <p className="font-medium">
                    Assigned to: {ticketData.counterName}
                  </p>
                  <p className="text-sm text-sky-600 mt-1">
                    Please proceed to this counter
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={resetForm}
              className="w-full bg-sky-500 hover:bg-sky-600 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
            >
              Get Another Ticket
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-sky-700 mb-2">
                Are you a PWD?
              </label>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => setIsPWD(false)}
                  className={`w-full py-3 px-6 rounded-lg transition-all duration-200 ${
                    !isPWD
                      ? "bg-sky-500 text-white"
                      : "bg-white border border-sky-200 text-sky-700"
                  }`}
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={() => setIsPWD(true)}
                  className={`w-full py-3 px-6 rounded-lg transition-all duration-200 ${
                    isPWD
                      ? "bg-sky-500 text-white"
                      : "bg-white border border-sky-200 text-sky-700"
                  }`}
                >
                  Yes
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-sky-700 mb-2">
                Choose Service Type
              </label>
              <select
                value={selectedCounterCode}
                onChange={(e) => setSelectedCounterCode(e.target.value)}
                className="w-full px-4 py-3 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all bg-white"
              >
                {isPWD ? (
                  <>
                    <option value="PWD-CW">PWD - Customer Welfare</option>
                    <option value="PWD-NSA">
                      PWD - New Service Application
                    </option>
                    <option value="PWD-P">PWD - Payment</option>
                  </>
                ) : (
                  <>
                    <option value="CW">Customer Welfare</option>
                    <option value="NSA">New Service Application</option>
                    <option value="P">Payment</option>
                  </>
                )}
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
