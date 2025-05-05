"use client";
import React, {
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import Image from "next/image";

type Service = {
  id: string;
  name: string;
};

type DisplayCounter = {
  id: string;
  name: string;
  code: string;
  currentTicket?: {
    number: number;
    prefix: string;
    isPrioritized: boolean;
    status: string;
    service?: Service;
  } | null;
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
            animationDuration: `${
              Math.random() * 3 + 2
            }s`,
            animationDelay: `${
              Math.random() * 5
            }s`,
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
          filter: drop-shadow(
            0 0 5px rgba(77, 208, 225, 0.3)
          );
          animation: fall linear infinite;
        }

        @keyframes fall {
          0% {
            transform: translateY(-50px) scale(1);
          }
          70% {
            transform: translateY(
                calc(100vh - 50px)
              )
              scale(1);
          }
          100% {
            transform: translateY(calc(100vh))
              scale(0);
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
        setRipples((prev) =>
          prev.filter(
            (r) => r.id !== newRipple.id
          )
        );
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
            box-shadow: 0 0 0 0
              rgba(77, 208, 225, 0.3);
            opacity: 0.8;
          }
          100% {
            box-shadow: 0 0 0 100px
              rgba(77, 208, 225, 0);
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
            E. Fernandez St., Brgy. Lagao, General
            Santos City, 9500, Philippines
          </span>
          <span className="mx-4">|</span>
          <span className="mx-4">
            Customer hotline: (083) 552 3824
          </span>
          <span className="mx-4">|</span>
          <span className="mx-4">
            Mobile Nos: 0998 5307 893, 0998 8485
            714, 0917 7049 979, 0917 7049 867
          </span>
        </div>
        <div
          className="marquee-content"
          aria-hidden="true"
        >
          <span className="mx-4 font-semibold">
            ©2021 General Santos Water District
          </span>
          <span className="mx-4">|</span>
          <span className="mx-4">
            E. Fernandez St., Brgy. Lagao, General
            Santos City, 9500, Philippines
          </span>
          <span className="mx-4">|</span>
          <span className="mx-4">
            Customer hotline: (083) 552 3824
          </span>
          <span className="mx-4">|</span>
          <span className="mx-4">
            Mobile Nos: 0998 5307 893, 0998 8485
            714, 0917 7049 979, 0917 7049 867
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

// Modified component that displays content immediately
const ScreenDisplay = () => {
  const [
    currentImageIndex,
    setCurrentImageIndex,
  ] = useState(0);
  const [
    screensaverImages,
    setScreensaverImages,
  ] = useState<
    Array<{
      id: string;
      imageUrl: string;
      title: string;
      isActive: boolean;
    }>
  >([]);

  // Fetch images immediately
  useEffect(() => {
    async function fetchScreensaverImages() {
      try {
        const res = await fetch(
          "/api/screensaver"
        );
        const data = await res.json();
        // Only keep active images
        const activeImages = data.filter(
          (img: any) => img.isActive === true
        );
        setScreensaverImages(activeImages);
      } catch (error) {
        console.error(
          "Failed to fetch screensaver images:",
          error
        );
      }
    }
    fetchScreensaverImages();
  }, []);

  // Rotate images continuously
  useEffect(() => {
    let imageRotationTimer: NodeJS.Timeout;

    if (screensaverImages.length > 0) {
      imageRotationTimer = setInterval(() => {
        setCurrentImageIndex((prev) =>
          prev === screensaverImages.length - 1
            ? 0
            : prev + 1
        );
      }, 5000); // Change image every 5 seconds
    }

    return () => {
      if (imageRotationTimer)
        clearInterval(imageRotationTimer);
    };
  }, [screensaverImages.length]);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {screensaverImages.length > 0 ? (
        <div className="relative w-full h-full">
          {screensaverImages.map(
            (image, index) => (
              <div
                key={image.id}
                className={`absolute inset-0 transition-opacity duration-1000 ${
                  index === currentImageIndex
                    ? "opacity-100"
                    : "opacity-0"
                }`}
              >
                <Image
                  src={image.imageUrl}
                  alt={image.title}
                  className="w-full h-full object-contain"
                  width={1920}
                  height={1080}
                />
              </div>
            )
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="relative w-40 h-40 mb-4">
            <div className="absolute inset-0 bg-cyan-300 rounded-full blur-xl animate-pulse"></div>
            <Image
              src="/wdlogo.png"
              alt="GSCWD Logo"
              width={160}
              height={160}
              className="relative w-full h-full object-contain drop-shadow-2xl"
              priority
            />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white text-center mb-4 drop-shadow-lg">
            General Santos City Water District
          </h1>
          <div className="h-1 w-32 bg-cyan-300 rounded-full"></div>

          <div className="mt-6 water-fact p-4 bg-cyan-900/50 backdrop-blur-sm rounded-lg border border-cyan-700/50 max-w-xs">
            <h3 className="text-xl font-semibold text-cyan-100 mb-2">
              Did You Know?
            </h3>
            <p className="text-cyan-200 text-sm">
              Water conservation at home is
              important for protecting the
              environment and saving money on
              utility bills.
            </p>
          </div>
        </div>
      )}

      {/* Animated water bubbles */}
      <div className="bubbles">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="bubble"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${
                Math.random() * 5
              }s`,
              animationDuration: `${
                Math.random() * 5 + 5
              }s`,
              width: `${
                Math.random() * 30 + 10
              }px`,
              height: `${
                Math.random() * 30 + 10
              }px`,
            }}
          />
        ))}
      </div>

      {/* Animated waves overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
        <div className="wave wave1"></div>
        <div className="wave wave2"></div>
        <div className="wave wave3"></div>
        <div className="wave wave4"></div>
      </div>

      {/* Falling rain/water drops effect */}
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className={`raindrop raindrop-${i}`}
        ></div>
      ))}

      <style jsx>{`
        .bubbles {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 5;
          overflow: hidden;
        }

        .bubble {
          position: absolute;
          bottom: -50px;
          border-radius: 50%;
          background: radial-gradient(
            circle at 30% 30%,
            rgba(255, 255, 255, 0.6),
            rgba(77, 208, 225, 0.2)
          );
          backdrop-filter: blur(1px);
          box-shadow: inset 0 0 10px
            rgba(255, 255, 255, 0.5);
          animation: rise linear infinite,
            sway 3s ease-in-out infinite alternate;
          opacity: 0.6;
        }

        @keyframes rise {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 0.7;
          }
          100% {
            transform: translateY(-100vh)
              scale(0.5);
            opacity: 0;
          }
        }

        @keyframes sway {
          0% {
            transform: translateX(-5px);
          }
          100% {
            transform: translateX(5px);
          }
        }

        .wave {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 200%;
          height: 50px;
          background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%230099ff' fill-opacity='0.2' d='M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E")
            repeat-x;
          background-size: 100% 50px;
          animation: wave-animation 12s linear
            infinite;
        }

        .wave1 {
          bottom: -5px;
          opacity: 0.3;
          animation: wave-animation 10s linear
            infinite;
        }

        .wave2 {
          bottom: -15px;
          opacity: 0.2;
          animation: wave-animation 14s linear
            reverse infinite;
          background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%2300ccff' fill-opacity='0.2' d='M0,64L48,80C96,96,192,128,288,138.7C384,149,480,139,576,144C672,149,768,171,864,165.3C960,160,1056,128,1152,117.3C1248,107,1344,117,1392,122.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E")
            repeat-x;
        }

        .wave3 {
          bottom: -25px;
          opacity: 0.15;
          animation: wave-animation 17s linear
            infinite;
          background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%230088ff' fill-opacity='0.2' d='M0,96L48,112C96,128,192,160,288,186.7C384,213,480,235,576,218.7C672,203,768,149,864,154.7C960,160,1056,224,1152,218.7C1248,213,1344,139,1392,101.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E")
            repeat-x;
        }

        .wave4 {
          bottom: -35px;
          opacity: 0.1;
          animation: wave-animation 20s linear
            reverse infinite;
          background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%230066ff' fill-opacity='0.2' d='M0,128L48,128C96,128,192,128,288,149.3C384,171,480,213,576,224C672,235,768,213,864,192C960,171,1056,149,1152,160C1248,171,1344,213,1392,234.7L1440,256L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E")
            repeat-x;
        }

        @keyframes wave-animation {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .raindrop {
          position: absolute;
          top: -20px;
          width: 2px;
          height: 20px;
          background: linear-gradient(
            to bottom,
            rgba(255, 255, 255, 0),
            rgba(77, 208, 225, 0.6)
          );
          border-radius: 0 0 5px 5px;
          filter: drop-shadow(
            0 0 5px rgba(77, 208, 225, 0.3)
          );
          animation: fall linear infinite;
          z-index: 15;
        }

        ${Array.from({ length: 12 })
          .map(
            (_, i) => `
          .raindrop-${i} {
            left: ${Math.random() * 100}%;
            animation-delay: ${
              Math.random() * 5
            }s;
            animation-duration: ${
              Math.random() * 3 + 2
            }s;
            height: ${Math.random() * 15 + 15}px;
          }
        `
          )
          .join("")}

        @keyframes fall {
          0% {
            transform: translateY(-20px) scale(1);
            opacity: 0;
          }
          20% {
            opacity: 0.5;
          }
          100% {
            transform: translateY(calc(100vh))
              scale(0);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default function PaymentDisplay() {
  const [counters, setCounters] = useState<
    DisplayCounter[]
  >([]);
  const router = useRouter();

  useEffect(() => {
    // Initial fetch
    fetchCounters();

    // Set up Socket.IO connection
    const socket = io();

    // Listen for ticket updates
    socket.on("ticket:update", () => {
      console.log(
        "Ticket updated, refreshing counters"
      );
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
    // Filter to only include payment counters
    const paymentCounters = data.filter(
      (counter) => counter.code.startsWith("P")
    );
    setCounters(paymentCounters);
  }

  // Format ticket names to display as SERVICE-NUMBER or PWD-SERVICE-NUMBER for priority
  const formatTicketName = (
    ticket?: DisplayCounter["currentTicket"]
  ) => {
    if (!ticket) return "---";

    return ticket.isPrioritized
      ? `PWD-${ticket.prefix}-${ticket.number}`
      : `${ticket.prefix}-${ticket.number}`;
  };

  // Sort payment counters by their number
  const sortedCounters = counters.sort((a, b) => {
    const numA =
      parseInt(a.code.replace("P", "")) || 0;
    const numB =
      parseInt(b.code.replace("P", "")) || 0;
    return numA - numB;
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-start p-0 relative overflow-hidden">
      {/* Add blinking animation style */}
      <style jsx global>{`
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

        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-15px);
          }
        }
        @keyframes float-delayed {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        @keyframes float-slow {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }
        .animate-float {
          animation: float 8s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 6s ease-in-out
            infinite 1s;
        }
        .animate-float-slow {
          animation: float-slow 10s ease-in-out
            infinite 2s;
        }

        @keyframes pop-in {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          70% {
            transform: scale(1.1);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-pop-in {
          animation: pop-in 0.6s
            cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        @keyframes fade-in {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-in-out
            forwards;
        }

        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
          }
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s
            cubic-bezier(
              0.175,
              0.885,
              0.32,
              1.275
            )
            forwards;
        }
      `}</style>

      {/* Background image with blur effect */}
      <div className="fixed flex flex-col items-center justify-center inset-0 z-0 w-full h-full">
        <Image
          src="/wdlogo.png"
          alt="Background"
          height={900}
          width={900}
          quality={100}
        />
        {/* Enhanced blur overlay */}
        <div className="absolute inset-0 backdrop-blur-md bg-black/70"></div>
      </div>

      {/* Water effects */}
      <WaterDrops />
      <WaterRipple />

      <div className="w-full z-10 relative flex flex-col h-screen pb-14">
        {/* Header with payment section name */}
        <div className="flex justify-center py-4">
          <h1 className="text-3xl font-bold text-white bg-sky-800 px-8 py-2 rounded-full shadow-lg">
            Payment Counters
          </h1>
        </div>

        {/* Split Layout */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-5 py-2 px-2 md:px-6 lg:px-10 overflow-hidden">
          {/* Left side - Payment Counter Display */}
          <div className="md:col-span-3 overflow-y-auto pr-4 border-r border-cyan-800/30">
            {sortedCounters.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedCounters.map((counter) => (
                  <div
                    key={counter.id}
                    onClick={() =>
                      router.push(
                        `/display/${counter.id}`
                      )
                    }
                    className="bg-gradient-to-br from-cyan-100/80 to-blue-200/80 backdrop-blur-sm rounded-xl shadow-lg p-4 hover:shadow-xl transition-all duration-300 border border-blue-100 cursor-pointer hover:from-cyan-200/90 hover:to-blue-300/90 group flex flex-col"
                  >
                    <h2 className="text-lg font-semibold text-cyan-800 mb-3 text-center group-hover:text-blue-900">
                      {counter.name}
                    </h2>
                    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-white/80 to-cyan-50/80 rounded-lg p-6 shadow-inner border border-blue-50">
                      <p
                        className={`text-4xl font-bold ${
                          counter.currentTicket?.status?.toLowerCase() ===
                          "called"
                            ? "blink-animation"
                            : "text-sky-800"
                        }`}
                      >
                        {formatTicketName(
                          counter.currentTicket
                        )}
                      </p>
                    </div>
                    <p className="text-xs text-cyan-700 mt-2 text-center font-medium">
                      {counter.currentTicket
                        ? counter.currentTicket.status?.toLowerCase() ===
                          "called"
                          ? "Now Calling"
                          : counter.currentTicket.status?.toLowerCase() ===
                            "serving"
                          ? "Currently Serving"
                          : counter.currentTicket
                              .status
                        : ""}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-8 bg-white/10 backdrop-blur-sm rounded-xl">
                  <h3 className="text-xl text-white font-medium">
                    No payment counters available
                  </h3>
                </div>
              </div>
            )}
          </div>

          {/* Right side - Screensaver */}
          <div className="hidden md:block md:col-span-2 h-full">
            <ScreenDisplay />
          </div>
        </div>
      </div>

      {/* Scrolling footer with contact information */}
      <ScrollingFooter />
    </div>
  );
}
