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
  const socketRef = useRef<Socket | null>(null);
  // Refs to track previous ticket state for sound trigger
  const prevTicketIdRef = useRef<string | null>(null);
  const prevTicketStatusRef = useRef<string | null>(null);

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
        // Removed sound playing logic from here
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.off("connect");
        socketRef.current.off("connect_error");
        socketRef.current.off("ticket:update");
        socketRef.current.disconnect();
      }
      // Removed beep interval clearing as it's no longer used
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
      // Removed beep interval clearing as it's no longer used
    };
  }, []);
  // Play TTS only when ticket status is CALLED
  useEffect(() => {
    const currentTicket = data?.ticket;
    const currentTicketId = currentTicket?.id;
    const currentStatus = currentTicket?.status;
    const counterName = data?.counter?.name;

    const speakTicket = (ticket: Ticket, counterName: string) => {
      if (!window.speechSynthesis) return;
      // Format ticket number as individual digits (e.g., 019 -> 'zero one nine')
      const numStr = formatTicketNumber(ticket.ticketNumber)
        .split("")
        .map((d) => {
          switch (d) {
            case "0":
              return "zero";
            case "1":
              return "one";
            case "2":
              return "two";
            case "3":
              return "three";
            case "4":
              return "four";
            case "5":
              return "five";
            case "6":
              return "six";
            case "7":
              return "seven";
            case "8":
              return "eight";
            case "9":
              return "nine";
            default:
              return d;
          }
        })
        .join(" ");
      const ticketStr = `${ticket.isPrioritized ? "PWD-" : ""}${ticket.prefix
        } ${numStr}`;
      const message = `${ticketStr} please proceed to ${counterName}`;
      const synth = window.speechSynthesis;
      let voices = synth.getVoices();
      // Try to select a natural-sounding male English voice
      let selectedVoice = voices.find(
        (v) => v.lang.startsWith("en") && v.name.toLowerCase().includes("male")
      );
      if (!selectedVoice) {
        // Fallback: pick a male-sounding voice by name
        selectedVoice = voices.find(
          (v) =>
            v.lang.startsWith("en") &&
            (v.name.toLowerCase().includes("david") ||
              v.name.toLowerCase().includes("matthew") ||
              v.name.toLowerCase().includes("alex") ||
              v.name.toLowerCase().includes("daniel") ||
              v.name.toLowerCase().includes("fred"))
        );
      }
      if (!selectedVoice) {
        // Fallback: pick any English voice
        selectedVoice = voices.find((v) => v.lang.startsWith("en"));
      }
      const utter = new window.SpeechSynthesisUtterance(message);
      utter.lang = selectedVoice?.lang || "en-US";
      utter.voice = selectedVoice || null;
      utter.rate = 0.8;
      utter.pitch = 1.0;
      synth.cancel(); // Stop any ongoing speech
      // Some browsers load voices asynchronously
      if (voices.length === 0) {
        synth.onvoiceschanged = () => {
          voices = synth.getVoices();
          let v = voices.find(
            (v) =>
              v.lang.startsWith("en") && v.name.toLowerCase().includes("male")
          );
          if (!v) {
            v = voices.find(
              (v) =>
                v.lang.startsWith("en") &&
                (v.name.toLowerCase().includes("david") ||
                  v.name.toLowerCase().includes("matthew") ||
                  v.name.toLowerCase().includes("alex") ||
                  v.name.toLowerCase().includes("daniel") ||
                  v.name.toLowerCase().includes("fred"))
            );
          }
          if (!v) {
            v = voices.find((v) => v.lang.startsWith("en"));
          }
          utter.voice = v || null;
          synth.speak(utter);
        };
      } else {
        synth.speak(utter);
      }
    };

    // Only play TTS when ticket status is "CALLED" and either ID or status has changed
    if (
      currentTicket &&
      counterName &&
      currentStatus?.toLowerCase() === "called" &&
      (currentTicketId !== prevTicketIdRef.current ||
        (currentStatus !== prevTicketStatusRef.current &&
          prevTicketStatusRef.current?.toLowerCase() !== "called"))
    ) {
      speakTicket(currentTicket, counterName);
    }

    prevTicketIdRef.current = currentTicketId || null;
    prevTicketStatusRef.current = currentStatus || null;
  }, [
    data?.ticket,
    data?.ticket?.id,
    data?.ticket?.status,
    data?.counter?.name,
  ]); // Depend explicitly on id and status

  // Removed the previous useEffect hook that handled interval beeping

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
      <header className="w-full flex items-center justify-between bg-sky-700 text-white shadow-lg fixed top-0 left-0 right-0 py-3">
        <div className="flex items-center gap-4 px-4">
          <div className="min-w-[100px]">
            <Image
              width={100}
              height={100}
              src="/wdlogo.png"
              alt="Logo"
              className="object-contain"
            />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl xl:text-6xl font-bold leading-tight tracking-wide">
            GENERAL SANTOS CITY WATER DISTRICT
          </h1>
        </div>
      </header>

      <div className="w-full flex flex-col items-center justify-center">
        {/* Counter name in fixed position below header */}
        <div className="fixed top-[120px] left-0 right-0 bg-sky-50 py-4 z-10">
          <h1 className="text-8xl font-bold mt-6 text-sky-800 text-center">
            {counter?.name || "Counter Display"}
          </h1>
        </div>

        {/* Main content with adjusted spacing from fixed header and counter name */}
        <div className="mt-[150px]">
          {ticket && ticket.id ? (
            <div className="flex flex-col items-center">
              <p
                className={`text-[16rem] font-bold ${ticket.status.toLowerCase() === "called"
                  ? "blink-animation"
                  : "text-sky-800"
                  }`}
              >
                {`${ticket.isPrioritized ? "PWD-" : ""}${ticket.prefix
                  }-${formatTicketNumber(ticket.ticketNumber)}`}
              </p>

              <p className="text-7xl text-gray-600 text-center">
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
