"use client";
import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { useParams } from "next/navigation";
import { io } from "socket.io-client";
import { Socket } from "socket.io-client";
import Image from "next/image";

import Header from "@/components/Header";
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
function formatTicketNumber(
  number: number
): string {
  return String(number).padStart(3, "0");
}

export default function CounterDisplayPage() {
  const { counterId } = useParams<{
    counterId: string;
  }>();
  const [data, setData] =
    useState<DisplayData | null>(null);
  const audioRef =
    useRef<HTMLAudioElement | null>(null);
  const socketRef = useRef<Socket | null>(null);
  // Refs to track previous ticket state for sound trigger
  const prevTicketIdRef = useRef<string | null>(
    null
  );
  const prevTicketStatusRef = useRef<
    string | null
  >(null);
  const [audioEnabled, setAudioEnabled] =
    useState(false);
  const bellSoundRef =
    useRef<HTMLAudioElement | null>(null);
  const [socketConnected, setSocketConnected] =
    useState(false);

  const fetchTicket = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/display/${counterId}`
      );
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
      setSocketConnected(true); // Update connection status
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
      setSocketConnected(false); // Update connection status
    });

    socket.on("connect_error", (error) => {
      console.error(
        "Socket connection error:",
        error
      );
    });

    // Listen for ticket updates
    socket.on("ticket:update", (ticketData) => {
      console.log(
        "Received ticket update:",
        ticketData
      );
      // If ticket is for this counter, update display
      if (ticketData.counterId === counterId) {
        setData((prevData) =>
          prevData
            ? {
                ...prevData,
                ticket:
                  ticketData.status === "SERVED"
                    ? null
                    : ticketData,
              }
            : null
        );
        // Removed sound playing logic from here
      }
    });

    // Update the ring:bell event handler
    socket.on("ring:bell", (data) => {
      console.log(
        "Ring bell event received",
        data
      );

      if (bellSoundRef.current) {
        try {
          // Reset to beginning in case it was played before
          bellSoundRef.current.currentTime = 0;

          const playPromise =
            bellSoundRef.current.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() =>
                console.log("Bell sound playing")
              )
              .catch((err) => {
                console.error(
                  "Error playing bell sound:",
                  err
                );
                // If autoplay was prevented, show the enable sound button
                setAudioEnabled(false);
              });
          }
        } catch (error) {
          console.error(
            "Error playing bell sound:",
            error
          );
        }
      } else {
        console.warn(
          "Bell sound not initialized yet"
        );
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.off("connect");
        socketRef.current.off("connect_error");
        socketRef.current.off("ticket:update");
        socketRef.current.off("ring:bell");
        socketRef.current.disconnect();
      }
      // Removed beep interval clearing as it's no longer used
    };
  }, [counterId, fetchTicket]);

  // Replace the useEffect that handles bell sound initialization

  // Create and preload the bell sound with autoplay unlock
  useEffect(() => {
    // Create audio context to work with
    let audioContext;
    try {
      const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;
      audioContext = new AudioContext();
    } catch (e) {
      console.error(
        "Web Audio API not supported:",
        e
      );
    }

    // Create the bell sound
    const bell = new Audio("/bell.mp3");
    bell.volume = 1.0;
    bell.preload = "auto";
    bellSoundRef.current = bell;

    // Try to load the audio file
    bell.load();

    // Function to unlock audio on the first user interaction
    const unlockAudio = () => {
      if (
        audioContext &&
        audioContext.state === "suspended"
      ) {
        audioContext.resume();
      }

      // Create and play a short, silent sound to unlock audio
      const silentSound = new Audio();
      silentSound.src =
        "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjIwLjEwMAAAAAAAAAAAAAAA//tUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABGwD///////////////////////////////////////////8AAAA8TEFNRTMuMTAwA8MAAAAAAAAAABQgJAUHQQAB9AAAARsaa5WFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
      silentSound.volume = 0.001;
      silentSound
        .play()
        .catch((e) =>
          console.log(
            "Silent sound playback failed:",
            e
          )
        );

      // Play a test with the actual sound to fully unlock
      bell.volume = 0.001; // Very quiet
      bell
        .play()
        .then(() => {
          console.log("Audio context unlocked");
          bell.pause();
          bell.currentTime = 0;
          bell.volume = 1.0; // Reset volume to normal
          setAudioEnabled(true);
        })
        .catch((e) =>
          console.error(
            "Could not unlock audio:",
            e
          )
        );

      // Remove event listeners once unlocked
      document.removeEventListener(
        "click",
        unlockAudio
      );
      document.removeEventListener(
        "touchstart",
        unlockAudio
      );
    };

    // Add event listeners to unlock audio on first interaction
    document.addEventListener(
      "click",
      unlockAudio
    );
    document.addEventListener(
      "touchstart",
      unlockAudio
    );

    return () => {
      // Clean up
      document.removeEventListener(
        "click",
        unlockAudio
      );
      document.removeEventListener(
        "touchstart",
        unlockAudio
      );
      if (bellSoundRef.current) {
        bellSoundRef.current = null;
      }
    };
  }, []);
  // Play TTS only when ticket status is CALLED
  useEffect(() => {
    const currentTicket = data?.ticket;
    const currentTicketId = currentTicket?.id;
    const currentStatus = currentTicket?.status;
    const counterName = data?.counter?.name;

    const speakTicket = (
      ticket: Ticket,
      counterName: string
    ) => {
      if (!window.speechSynthesis) return;
      // Format ticket number as individual digits (e.g., 019 -> 'zero one nine')
      const numStr = formatTicketNumber(
        ticket.ticketNumber
      )
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
      const ticketStr = `${
        ticket.isPrioritized ? "PWD-" : ""
      }${ticket.prefix} ${numStr}`;
      const message = `${ticketStr} please proceed to ${counterName}`;
      const synth = window.speechSynthesis;
      let voices = synth.getVoices();
      // Try to select a natural-sounding male English voice
      let selectedVoice = voices.find(
        (v) =>
          v.lang.startsWith("en") &&
          v.name.toLowerCase().includes("male")
      );
      if (!selectedVoice) {
        // Fallback: pick a male-sounding voice by name
        selectedVoice = voices.find(
          (v) =>
            v.lang.startsWith("en") &&
            (v.name
              .toLowerCase()
              .includes("david") ||
              v.name
                .toLowerCase()
                .includes("matthew") ||
              v.name
                .toLowerCase()
                .includes("alex") ||
              v.name
                .toLowerCase()
                .includes("daniel") ||
              v.name
                .toLowerCase()
                .includes("fred"))
        );
      }
      if (!selectedVoice) {
        // Fallback: pick any English voice
        selectedVoice = voices.find((v) =>
          v.lang.startsWith("en")
        );
      }
      const utter =
        new window.SpeechSynthesisUtterance(
          message
        );
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
              v.lang.startsWith("en") &&
              v.name
                .toLowerCase()
                .includes("male")
          );
          if (!v) {
            v = voices.find(
              (v) =>
                v.lang.startsWith("en") &&
                (v.name
                  .toLowerCase()
                  .includes("david") ||
                  v.name
                    .toLowerCase()
                    .includes("matthew") ||
                  v.name
                    .toLowerCase()
                    .includes("alex") ||
                  v.name
                    .toLowerCase()
                    .includes("daniel") ||
                  v.name
                    .toLowerCase()
                    .includes("fred"))
            );
          }
          if (!v) {
            v = voices.find((v) =>
              v.lang.startsWith("en")
            );
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
      (currentTicketId !==
        prevTicketIdRef.current ||
        (currentStatus !==
          prevTicketStatusRef.current &&
          prevTicketStatusRef.current?.toLowerCase() !==
            "called"))
    ) {
      speakTicket(currentTicket, counterName);
    }

    prevTicketIdRef.current =
      currentTicketId || null;
    prevTicketStatusRef.current =
      currentStatus || null;
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
    <div className="">
      {/* Status indicators */}
      <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2">
        <div
          className={`w-3 h-3 rounded-full ${
            socketConnected
              ? "bg-green-500"
              : "bg-red-500"
          }`}
        ></div>
        <span className="text-sm">
          {socketConnected
            ? "Socket Connected"
            : "Socket Disconnected"}
        </span>
        <span className="text-sm ml-4">
          {audioEnabled
            ? "🔊 Audio Enabled"
            : "🔇 Audio Disabled"}
        </span>
      </div>
      {/* Add bell sound enable button that's visible only when needed */}
      {!audioEnabled && (
        <div className="fixed top-4 right-4 z-50">
          <button
            onClick={() => {
              if (bellSoundRef.current) {
                // Playing a very short sound to enable audio context
                bellSoundRef.current.volume = 0.1;
                bellSoundRef.current
                  .play()
                  .then(() => {
                    setAudioEnabled(true);
                    console.log(
                      "Audio enabled by user interaction"
                    );
                  })
                  .catch((err) =>
                    console.error(
                      "Could not enable audio:",
                      err
                    )
                  );
              }
            }}
            className="bg-sky-600 hover:bg-sky-700 text-white py-2 px-4 rounded shadow-lg"
          >
            Enable Sound
          </button>
        </div>
      )}

      {/* Add a debug button for testing */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => {
            if (bellSoundRef.current) {
              bellSoundRef.current.currentTime = 0;
              bellSoundRef.current
                .play()
                .then(() =>
                  console.log("Test bell played")
                )
                .catch((err) =>
                  console.error(
                    "Test bell failed:",
                    err
                  )
                );
            }
          }}
          className="bg-red-500 hover:bg-red-600 text-white p-2 rounded shadow-lg"
        >
          Test Bell
        </button>
      </div>
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

      {/* <Header>
      <h1 className="text-6xl font-bold text-white">
            GENERAL SANTOS CITY WATER DISTRICT
          </h1>
      </Header> */}

      <div className="w-full h-[100vh] flex flex-col items-center justify-center">
        {/* Counter name in fixed position below header */}
        <div className="fixed top-[120px] left-0 right-0 py-4 z-10">
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
                  ticket.status.toLowerCase() ===
                  "called"
                    ? "blink-animation"
                    : "text-sky-800"
                }`}
              >
                {`${
                  ticket.isPrioritized
                    ? "PWD-"
                    : ""
                }${
                  ticket.prefix
                }-${formatTicketNumber(
                  ticket.ticketNumber
                )}`}
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
            <p className="text-3xl mt-10 text-gray-600">
              No ticket called yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
