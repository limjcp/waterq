"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import Image from "next/image";

type DisplayCounter = {
  id: string;
  name: string;
  code: string;
  currentTicket?: string; // e.g. "CW12"
};

// Component for water drop animation
const WaterDrops = () => {
  return (
    <div className="water-container">
      {[...Array(15)].map((_, i) => (
        <div
          key={i}
          className="water-drop"
          style={{
            left: `${Math.random() * 100}%`,
            animationDuration: `${Math.random() * 3 + 2}s`,
            animationDelay: `${Math.random() * 5}s`,
            opacity: Math.random() * 0.5 + 0.2,
          }}
        />
      ))}
      <style jsx global>{`
        .water-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          pointer-events: none;
          z-index: 5;
        }

        .water-drop {
          position: absolute;
          top: -50px;
          width: 2px;
          height: 50px;
          background: linear-gradient(
            to bottom,
            rgba(255, 255, 255, 0) 0%,
            rgba(77, 208, 225, 0.6) 100%
          );
          border-radius: 0 0 5px 5px;
          filter: drop-shadow(0 0 5px rgba(77, 208, 225, 0.3));
          animation: fall linear infinite;
        }

        @keyframes fall {
          0% {
            transform: translateY(-50px) scale(1);
          }
          70% {
            transform: translateY(calc(100vh - 50px)) scale(1);
          }
          100% {
            transform: translateY(calc(100vh)) scale(0);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

// Ripple effect component
const WaterRipple = () => {
  const [ripples, setRipples] = useState<
    { id: number; x: number; y: number }[]
  >([]);

  useEffect(() => {
    // Add random ripples periodically
    const interval = setInterval(() => {
      const newRipple = {
        id: Date.now(),
        x: Math.random() * 100,
        y: Math.random() * 100,
      };

      setRipples((prev) => [...prev, newRipple]);

      // Remove ripple after animation completes
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, 4000);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="ripple-container">
      {ripples.map((ripple) => (
        <div
          key={ripple.id}
          className="ripple"
          style={{
            left: `${ripple.x}%`,
            top: `${ripple.y}%`,
          }}
        />
      ))}
      <style jsx global>{`
        .ripple-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          pointer-events: none;
          z-index: 4;
        }

        .ripple {
          position: absolute;
          width: 1px;
          height: 1px;
          background: transparent;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          animation: ripple 4s ease-out;
        }

        @keyframes ripple {
          0% {
            box-shadow: 0 0 0 0 rgba(77, 208, 225, 0.3);
            opacity: 0.8;
          }
          100% {
            box-shadow: 0 0 0 100px rgba(77, 208, 225, 0);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

// Scrolling footer component
const ScrollingFooter = () => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-cyan-900/80 to-blue-900/80 text-white py-3 z-20">
      <div className="marquee-container">
        <div className="marquee-content">
          <span className="mx-4 font-semibold">
            ©2021 General Santos Water District
          </span>
          <span className="mx-4">|</span>
          <span className="mx-4">
            E. Fernandez St., Brgy. Lagao, General Santos City, 9500,
            Philippines
          </span>
          <span className="mx-4">|</span>
          <span className="mx-4">Customer hotline: (083) 552 3824</span>
          <span className="mx-4">|</span>
          <span className="mx-4">
            Mobile Nos: 0998 5307 893, 0998 8485 714, 0917 7049 979, 0917 7049
            867
          </span>
        </div>
        <div className="marquee-content" aria-hidden="true">
          <span className="mx-4 font-semibold">
            ©2021 General Santos Water District
          </span>
          <span className="mx-4">|</span>
          <span className="mx-4">
            E. Fernandez St., Brgy. Lagao, General Santos City, 9500,
            Philippines
          </span>
          <span className="mx-4">|</span>
          <span className="mx-4">Customer hotline: (083) 552 3824</span>
          <span className="mx-4">|</span>
          <span className="mx-4">
            Mobile Nos: 0998 5307 893, 0998 8485 714, 0917 7049 979, 0917 7049
            867
          </span>
        </div>
      </div>
      <style jsx global>{`
        .marquee-container {
          position: relative;
          width: 100%;
          height: 24px;
          overflow: hidden;
          white-space: nowrap;
        }

        .marquee-content {
          position: absolute;
          display: inline-flex;
          animation: marquee 25s linear infinite;
          padding-left: 100%;
        }

        .marquee-content:nth-child(2) {
          animation-delay: -12.5s;
        }

        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-200%);
          }
        }
      `}</style>
    </div>
  );
};

export default function DisplayBoard() {
  const [counters, setCounters] = useState<DisplayCounter[]>([]);
  const [selectedCounterIds, setSelectedCounterIds] = useState<Set<string>>(
    new Set()
  );
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Initial fetch
    fetchCounters();

    // Set up Socket.IO connection
    const socket = io();

    // Listen for ticket updates
    socket.on("ticket:update", () => {
      console.log("Ticket updated, refreshing counters");
      fetchCounters();
    });

    return () => {
      // Clean up socket connection on unmount
      socket.disconnect();
    };
  }, []);

  async function fetchCounters() {
    const res = await fetch("/api/display");
    const data = await res.json();
    setCounters(data);
  }

  const handleCounterToggle = (counterId: string) => {
    setSelectedCounterIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(counterId)) {
        newSet.delete(counterId);
      } else {
        newSet.add(counterId);
      }
      return newSet;
    });
  };

  // Filter counters based on selection
  const displayedCounters =
    selectedCounterIds.size > 0
      ? counters.filter((c) => selectedCounterIds.has(c.id))
      : counters;

  // Group counters by service type and sort them by their number
  const groupedCounters = {
    CW: displayedCounters
      .filter((c) => c.code.startsWith("CW"))
      .sort((a, b) => {
        const numA = parseInt(a.code.replace("CW", "")) || 0;
        const numB = parseInt(b.code.replace("CW", "")) || 0;
        return numA - numB;
      }),
    NSA: displayedCounters
      .filter((c) => c.code.startsWith("NSA"))
      .sort((a, b) => {
        const numA = parseInt(a.code.replace("NSA", "")) || 0;
        const numB = parseInt(b.code.replace("NSA", "")) || 0;
        return numA - numB;
      }),
    P: displayedCounters
      .filter((c) => c.code.startsWith("P"))
      .sort((a, b) => {
        const numA = parseInt(a.code.replace("P", "")) || 0;
        const numB = parseInt(b.code.replace("P", "")) || 0;
        return numA - numB;
      }),
  };

  // Group all counters by service type for the filter section
  const allGroupedCounters = {
    CW: counters.filter((c) => c.code.startsWith("CW")),
    NSA: counters.filter((c) => c.code.startsWith("NSA")),
    P: counters.filter((c) => c.code.startsWith("P")),
  };

  const serviceNames = {
    CW: "Customer Welfare",
    NSA: "New Service Application",
    P: "Payment",
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-0 relative overflow-hidden">
      {/* Background image with blur effect - stretched to fill the entire screen */}
      <div className="fixed inset-0 z-0 w-full h-full">
        <Image
          src="/wdlogo.png"
          alt="Background"
          fill
          sizes="100vw"
          quality={100}
          priority
          style={{
            objectFit: "cover",
            width: "100%",
            height: "100%",
          }}
        />
        {/* Enhanced blur overlay */}
        <div className="absolute inset-0 backdrop-blur-md bg-white/50"></div>
      </div>

      {/* Water effects */}
      <WaterDrops />
      <WaterRipple />

      <div className="w-full z-10 relative flex flex-col h-screen pb-14">
        <div className="flex flex-col items-center justify-center pt-4">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="mb-4 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition shadow-md hover:shadow-lg font-medium flex items-center space-x-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 transition-transform ${
                isFilterOpen ? "rotate-180" : ""
              }`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            <span>Filter Counters</span>
          </button>

          {isFilterOpen && (
            <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-md p-4 w-full max-w-2xl mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-sky-800">
                  Select Counters to Display
                </h3>
                {selectedCounterIds.size > 0 && (
                  <button
                    onClick={() => setSelectedCounterIds(new Set())}
                    className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white text-sm rounded-lg transition shadow-sm hover:shadow-md font-medium"
                  >
                    Clear All
                  </button>
                )}
              </div>
              <div className="space-y-4">
                {(["CW", "NSA", "P"] as const).map((serviceCode) => (
                  <div key={serviceCode} className="space-y-2">
                    <h4 className="font-medium text-sky-700">
                      {serviceNames[serviceCode]}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {allGroupedCounters[serviceCode].map((counter) => (
                        <label
                          key={counter.id}
                          className="flex items-center space-x-2 bg-sky-50 hover:bg-sky-100 px-3 py-2 rounded-lg cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedCounterIds.has(counter.id)}
                            onChange={() => handleCounterToggle(counter.id)}
                            className="form-checkbox h-4 w-4 text-sky-600 rounded border-sky-300 focus:ring-sky-500"
                          />
                          <span className="text-sm text-sky-700">
                            {counter.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 py-2 px-6 md:px-10 lg:px-14 overflow-y-auto">
          {/* Render counters by service group */}
          {(["CW", "NSA", "P"] as const).map(
            (serviceCode) =>
              groupedCounters[serviceCode].length > 0 && (
                <div key={serviceCode} className="mb-10">
                  <h2 className="text-2xl font-semibold text-sky-800 mb-6 pl-2 border-l-4 border-sky-500">
                    {serviceNames[serviceCode]}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {groupedCounters[serviceCode].map((c) => (
                      <div
                        key={c.id}
                        onClick={() => router.push(`/display/${c.id}`)}
                        className="bg-gradient-to-br from-cyan-100/80 to-blue-200/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 hover:shadow-2xl transition-all duration-300 border border-blue-100 cursor-pointer hover:from-cyan-200/90 hover:to-blue-300/90 group h-full flex flex-col"
                      >
                        <h2 className="text-xl font-semibold text-cyan-800 mb-5 text-center group-hover:text-blue-900">
                          {c.name}
                        </h2>
                        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-white/80 to-cyan-50/80 rounded-xl p-6 shadow-inner border border-blue-50">
                          <p className="text-4xl font-bold text-black">
                            {c.currentTicket || "---"}
                          </p>
                        </div>
                        <p className="text-sm text-cyan-700 mt-3 text-center font-medium">
                          {c.currentTicket
                            ? "Currently Serving"
                            : "No ticket called yet"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )
          )}
        </div>
      </div>

      {/* Scrolling footer with contact information */}
      <ScrollingFooter />
    </div>
  );
}
