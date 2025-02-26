"use client";
import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Service = {
  id: string;
  name: string;
};

type Counter = {
  id: string;
  name: string;
  code: string;
};

type Ticket = {
  id: string;
  ticketNumber: number;
  prefix: string;
  status: string;
  service?: Service;
};

type DisplayData = {
  counter: Counter;
  ticket: Ticket | null;
};

export default function CounterDisplayPage() {
  const { counterId } = useParams<{ counterId: string }>();
  const [data, setData] = useState<DisplayData | null>(null);

  async function fetchTicket() {
    try {
      const res = await fetch(`/api/display/${counterId}`);
      const responseData = await res.json();
      setData(responseData);
    } catch (error) {
      console.error(error);
    }
  }

  useEffect(() => {
    fetchTicket();
    const interval = setInterval(fetchTicket, 5000); // poll every 5 seconds
    return () => clearInterval(interval);
  }, [counterId]);

  const ticket = data?.ticket;
  const counter = data?.counter;

  return (
    <div className="min-h-screen w-full bg-sky-50 flex flex-col items-center justify-center p-6">
      <div className="w-full flex flex-col items-center justify-center">
        {/* Display counter name at the top */}
        <div className="absolute top-6 left-0 right-0 text-center">
          <h2 className="text-4xl font-bold text-sky-700">
            {counter?.name || "Counter Display"}
          </h2>
        </div>

        <h1 className="text-5xl font-bold mb-8 text-sky-800">
          {ticket?.service?.name}
        </h1>

        {ticket && ticket.id ? (
          <>
            <p className="text-9xl font-bold text-sky-800">
              {ticket.prefix}
              {ticket.ticketNumber}
            </p>
            <p className="mt-4 text-2xl text-gray-600">Currently Serving</p>
            {ticket.service && (
              <p className="mt-2 text-2xl text-gray-700">
                Service: {ticket.service.name}
              </p>
            )}
          </>
        ) : (
          <p className="text-3xl text-gray-600">No ticket called yet</p>
        )}
      </div>
    </div>
  );
}
