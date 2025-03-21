"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { io } from "socket.io-client";
import { Socket } from "socket.io-client";
import Image from "next/image";

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
  isPrioritized: boolean;
};

type DisplayData = {
  counter: Counter;
  ticket: Ticket | null;
};

// Add helper function to format ticket number
function formatTicketNumber(number: number): string {
  return String(number).padStart(3, "0");
}

export default function CounterDisplayPage() {
  const { counterId } = useParams<{ counterId: string }>();
  const [data, setData] = useState<DisplayData | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevStatusRef = useRef<string | null>(null);
  const beepIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const fetchTicket = useCallback(async () => {
    try {
      const res = await fetch(`/api/display/${counterId}`);
      const responseData = await res.json();
      setData(responseData);
    } catch (error) {
      console.error(error);
    }
  }, [counterId]);

  // Setup Socket.IO connection
  useEffect(() => {
    // Initial data fetch
    fetchTicket();

    // Connect to Socket.IO server
    const socket = io();
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected", socket.id);
      socket.emit("joinCounter", counterId);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    // Listen for ticket updates
    socket.on("ticket:update", (ticketData) => {
      console.log("Received ticket update:", ticketData);
      // If ticket is for this counter, update display
      if (ticketData.counterId === counterId) {
        setData((prevData) =>
          prevData
            ? {
                ...prevData,
                ticket: ticketData.status === "SERVED" ? null : ticketData,
              }
            : null
        );

        // Play beep sound for newly called tickets
        if (ticketData.status === "CALLED" && audioRef.current) {
          audioRef.current.play();
        }
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.off("connect");
        socketRef.current.off("connect_error");
        socketRef.current.off("ticket:update");
        socketRef.current.disconnect();
      }
      // Clear any ongoing beep intervals
      if (beepIntervalRef.current) {
        clearInterval(beepIntervalRef.current);
      }
    };
  }, [counterId, fetchTicket]);

  // Initialize audio element once on component mount
  useEffect(() => {
    const audio = new Audio("/beep.mp3");
    audio.preload = "auto";
    // Set volume to ensure it's audible
    audio.volume = 1.0;
    audioRef.current = audio;

    // Load the audio file
    audio.load();

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
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

    if (beepIntervalRef.current) {
      clearInterval(beepIntervalRef.current);
      beepIntervalRef.current = null;
    }

    const playBeep = async () => {
      if (!audioRef.current) return;

      try {
        audioRef.current.currentTime = 0;
        const playPromise = audioRef.current.play();

        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.error("Audio play error:", err);
            // Retry once
            setTimeout(() => {
              if (audioRef.current) {
                audioRef.current
                  .play()
                  .catch((e) => console.error("Retry failed:", e));
              }
            }, 100);
          });
        }
      } catch (err) {
        console.error("Error in playBeep:", err);
      }
    };

    if (
      data?.ticket &&
      currentStatus === "called" &&
      (previousStatus !== "called" || previousStatus === null)
    ) {
      playBeep();
      beepIntervalRef.current = setInterval(playBeep, 3000);
    }

    prevStatusRef.current = currentStatus || null;

    return () => {
      if (beepIntervalRef.current) {
        clearInterval(beepIntervalRef.current);
        beepIntervalRef.current = null;
      }
    };
  }, [data?.ticket]);

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

      {/* Header Section */}
      <header className="w-full flex items-center justify-between p-4 bg-sky-700 text-white shadow-lg fixed top-0 left-0 right-0">
        <div className="flex items-center">
          <Image width={100} height={100} src="/wdlogo.png" alt="Logo" />
          <h1 className="text-6xl font-bold">
            GENERAL SANTOS CITY WATER DISTRICT
          </h1>
        </div>
      </header>

      <div className="w-full flex flex-col items-center justify-center">
        {/* Counter name in fixed position below header */}
        <div className="fixed top-[120px] left-0 right-0 bg-sky-50 py-4 z-10">
          <h1 className="text-8xl font-bold text-sky-800 text-center">
            {counter?.name || "Counter Display"}
          </h1>
        </div>

        {/* Main content with adjusted spacing from fixed header and counter name */}
        <div className="mt-[150px]">
          {ticket && ticket.id ? (
            <div className="flex flex-col items-center">
              <p
                className={`text-[16rem] font-bold ${
                  ticket.status.toLowerCase() === "called"
                    ? "blink-animation"
                    : "text-sky-800"
                }`}
              >
                {`${ticket.isPrioritized ? "PWD-" : ""}${
                  ticket.prefix
                }-${formatTicketNumber(ticket.ticketNumber)}`}
              </p>

              <p className="text-5xl text-gray-600 text-center">
                Currently Serving
              </p>
              {ticket.service && (
                <p className="mt-2 text-2xl text-gray-700 text-center">
                  {/* Service: {ticket.service.name} */}
                </p>
              )}
            </div>
          ) : (
            <p className="text-3xl mt-10 text-gray-600">No ticket called yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
