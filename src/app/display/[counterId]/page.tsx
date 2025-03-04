"use client";
import React, { useEffect, useState, useRef } from "react";
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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevStatusRef = useRef<string | null>(null);
  const beepIntervalRef = useRef<NodeJS.Timeout | null>(null);

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

  // Initialize audio element once on component mount
  useEffect(() => {
    audioRef.current = new Audio("/beep.mp3"); // You'll need to place this file in your public directory
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // Clear any existing intervals when unmounting
      if (beepIntervalRef.current) {
        clearInterval(beepIntervalRef.current);
        beepIntervalRef.current = null;
      }
    };
  }, []);

  // Play sound when status changes to "called"
  useEffect(() => {
    const currentStatus = data?.ticket?.status?.toLowerCase();
    const previousStatus = prevStatusRef.current;

    // Clear any existing beep interval
    if (beepIntervalRef.current) {
      clearInterval(beepIntervalRef.current);
      beepIntervalRef.current = null;
    }

    // Only play beep if:
    // 1. There is a ticket
    // 2. Status is "called"
    // 3. This is a transition from another status to "called" or we're seeing this called ticket for the first time
    if (
      data?.ticket &&
      currentStatus === "called" &&
      (previousStatus !== "called" || previousStatus === null)
    ) {
      // Play sound immediately
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current
          .play()
          .catch((err) => console.error("Error playing audio:", err));

        // Set up interval to repeat beep every 3 seconds while status remains "called"
        beepIntervalRef.current = setInterval(() => {
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current
              .play()
              .catch((err) => console.error("Error playing audio:", err));
          }
        }, 3000);
      }
    }

    // Update the previous status reference
    prevStatusRef.current = currentStatus || null;

    // Clean up on unmount or status change
    return () => {
      if (beepIntervalRef.current) {
        clearInterval(beepIntervalRef.current);
        beepIntervalRef.current = null;
      }
    };
  }, [data?.ticket?.status]);

  const ticket = data?.ticket;
  const counter = data?.counter;

  return (
    <div className="min-h-screen w-full bg-sky-50 flex flex-col items-center justify-center p-6">
      {/* Add blinking animation style */}
      <style jsx>{`
        @keyframes blink {
          0% {
            color: rgb(7, 89, 133);
          } /* text-sky-800 */
          50% {
            color: rgb(220, 38, 38);
          } /* text-red-600 */
          100% {
            color: rgb(7, 89, 133);
          } /* text-sky-800 */
        }
        .blink-animation {
          animation: blink 1s infinite;
        }
      `}</style>

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
            <p
              className={`text-9xl font-bold ${
                ticket.status.toLowerCase() === "called"
                  ? "blink-animation"
                  : "text-sky-800"
              }`}
            >
              {ticket.prefix}
              {ticket.ticketNumber}
            </p>

            {/* Add status indicator */}
            <div
              className={`mt-4 px-6 py-2 rounded-full ${
                ticket.status.toLowerCase() === "called"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              <p className="text-3xl font-semibold">
                {ticket.status.charAt(0).toUpperCase() +
                  ticket.status.slice(1).toLowerCase()}
              </p>
            </div>

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
