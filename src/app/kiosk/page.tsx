"use client";
import React, { useState, useEffect } from "react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { User } from "lucide-react";
import { Wheelchair } from "@phosphor-icons/react";
import Image from "next/image";

// Update screensaver timeout to 3 seconds
const SCREENSAVER_TIMEOUT = 60 * 1000;

// Add utility function for ticket formatting
function formatTicketNumber(
  ticketNumber: string,
  isPWD: boolean = false
): string {
  if (!ticketNumber) return "";

  // If already has a dash, we need to reformat it
  if (ticketNumber.includes("-")) {
    // Split by dash
    const parts = ticketNumber.split("-");
    const prefix = parts[0];
    const number = parts[1];

    if (number && !isNaN(parseInt(number))) {
      // Format with PWD prefix if needed
      return isPWD
        ? `PWD-${prefix}-${number.padStart(3, "0")}`
        : `${prefix}-${number.padStart(3, "0")}`;
    }
    return ticketNumber;
  }

  // Find where the numbers start
  const numberIndex = ticketNumber.search(/\d/);
  if (numberIndex === -1) return ticketNumber;

  // Split prefix and number
  const prefix = ticketNumber.substring(0, numberIndex);
  const number = ticketNumber.substring(numberIndex);

  // Format with PWD prefix if needed
  return isPWD
    ? `PWD-${prefix}-${number.padStart(3, "0")}`
    : `${prefix}-${number.padStart(3, "0")}`;
}

type TicketResponse = {
  ticketNumber: string;
  status: string;
  counterId: string | null;
  counterName: string | null;
  isPrioritized: boolean;
};

type ServiceOption = {
  code: string;
  name: string;
  description: string;
};

export default function Kiosk() {
  const [currentStep, setCurrentStep] = useState(1);
  const [ticketData, setTicketData] = useState<TicketResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPWD, setIsPWD] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [showScreensaver, setShowScreensaver] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [screensaverImages, setScreensaverImages] = useState<
    Array<{ id: string; imageUrl: string; title: string; isActive: boolean }>
  >([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [lastServiceCode, setLastServiceCode] = useState("");

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let scrollInterval: NodeJS.Timeout;

    const resetScreensaverTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (scrollInterval) clearInterval(scrollInterval);
      timeoutId = setTimeout(() => {
        setShowScreensaver(true);
        // Start auto-scrolling when screensaver shows
        scrollInterval = setInterval(() => {
          setScrollPosition((prev) => {
            const scrollContainer = document.querySelector(
              ".screensaver-content"
            );
            if (scrollContainer) {
              const maxScroll =
                scrollContainer.scrollHeight - scrollContainer.clientHeight;
              // Reset to top when reaching bottom
              if (prev >= maxScroll) {
                return 0;
              }
              // Scroll by 1 pixel every 50ms (smooth scrolling)
              return prev + 1;
            }
            return prev;
          });
        }, 50);
      }, SCREENSAVER_TIMEOUT);
    };

    const handleUserActivity = () => {
      if (showScreensaver) {
        setShowScreensaver(false);
        setScrollPosition(0);
        if (scrollInterval) clearInterval(scrollInterval);
      }
      resetScreensaverTimer();
    };

    resetScreensaverTimer();
    window.addEventListener("mousemove", handleUserActivity);
    window.addEventListener("click", handleUserActivity);
    window.addEventListener("keydown", handleUserActivity);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (scrollInterval) clearInterval(scrollInterval);
      window.removeEventListener("mousemove", handleUserActivity);
      window.removeEventListener("click", handleUserActivity);
      window.removeEventListener("keydown", handleUserActivity);
    };
  }, [showScreensaver]);

  // Add effect to update scroll position
  useEffect(() => {
    if (showScreensaver) {
      const scrollContainer = document.querySelector(".screensaver-content");
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollPosition;
      }
    }
  }, [scrollPosition, showScreensaver]);

  // Add effect to fetch screensaver images
  useEffect(() => {
    async function fetchScreensaverImages() {
      try {
        const res = await fetch("/api/screensaver");
        const data = await res.json();
        // Only keep active images
        const activeImages = data.filter((img: any) => img.isActive === true);
        setScreensaverImages(activeImages);
      } catch (error) {
        console.error("Failed to fetch screensaver images:", error);
      }
    }
    fetchScreensaverImages();
  }, []);

  // Add new useEffect for image rotation
  useEffect(() => {
    let imageRotationTimer: NodeJS.Timeout;

    if (showScreensaver && screensaverImages.length > 0) {
      imageRotationTimer = setInterval(() => {
        setCurrentImageIndex((prev) =>
          prev === screensaverImages.length - 1 ? 0 : prev + 1
        );
      }, 5000); // Change image every 5 seconds
    }

    return () => {
      if (imageRotationTimer) clearInterval(imageRotationTimer);
    };
  }, [showScreensaver, screensaverImages.length]);

  const services: ServiceOption[] = [
    {
      code: "CW",
      name: "Customer Welfare",
      description: "",
    },
    {
      code: "NSA",
      name: "New Service Application",
      description: "",
    },
    {
      code: "P",
      name: "Payment",
      description: "",
    },
  ]; // Add print function
  function printTicket(ticket: TicketResponse) {
    const printWindow = window.open("", "", "width=300,height=200");
    if (!printWindow) return;

    const ticketHtml = `
      <!DOCTYPE html>
<html>
  <head>
    <title>Queue Ticket</title>
    <style>
      @page {
        size: 89mm 51mm portrait;
        margin: 0;
      }
      html,
      body {
        margin: 0;
        padding: 0;
        width: 89mm;
        height: 51mm;
        overflow: hidden;
      }
      .ticket-container {
        width: 65mm;
        height: 40mm;
        box-sizing: border-box;
        border: 2px solid #000000;
        border-radius: 1px;
        background-color: #ffffff;
        padding: 0px;
        position: absolute;
      }
      .ticket {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 100%;
        text-align: center;
        width: 100%;
      }
      .ticket-number {
        font-size: 36px;
        font-weight: bold;
        font-family: "Courier New", monospace;
        margin: 0;
        line-height: 1.2;
      }
      .timestamp {
        font-size: 14px;
        font-family: "Courier New", monospace;
        margin-top: 8px;
      }
      @media print {
        @page {
          margin: 0;
        }
        html,
        body {
          width: 80mm;
          height: 60mm;
        }
        .ticket {
          page-break-after: avoid;
          page-break-inside: avoid;
        }
      }
    </style>
  </head>
  <body>
    <div class="ticket-container">
      <div class="ticket">
        <div class="ticket-number">PWD-NSA-001</div>
        <div class="timestamp">4/22/2025 9:22:27 AM</div>
      </div>
    </div>
    <script>
      window.onload = () => {
        window.print();
        setTimeout(() => window.close(), 500);
      };
    </script>
  </body>
</html>

    `;

    printWindow.document.write(ticketHtml);
    printWindow.document.close();
  }
  async function handleGenerateTicket(serviceCode: string) {
    // Store the service code for retry functionality
    setLastServiceCode(serviceCode);
    setIsLoading(true);
    setError(null);
    setShowErrorModal(false);

    // Create a timeout promise that rejects after 5 seconds
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error("Ticket generation timed out. Please try again."));
      }, 5000); // 5 seconds timeout
    });

    try {
      // Extract the actual service code without the PWD prefix if present
      const actualServiceCode = serviceCode.replace("PWD-", "");

      // Race between the fetch operation and the timeout
      const fetchPromise = fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceCode: actualServiceCode,
          isPrioritized: isPWD,
        }),
      });

      // Wait for either the fetch to complete or the timeout to occur
      const res = (await Promise.race([
        fetchPromise,
        timeoutPromise,
      ])) as Response;

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to generate ticket");
      }

      const data = await res.json();
      setTicketData(data);
      setCurrentStep(3);
      // Trigger print after ticket is generated
      printTicket(data);
    } catch (err) {
      console.error(err);
      const message =
        err instanceof Error ? err.message : "Failed to generate ticket";
      setError(message);
      setErrorMessage(message);
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  }

  function selectUserType(isPWD: boolean) {
    setIsPWD(isPWD);
    setCurrentStep(2);
  }
  function goBack() {
    // Just close the modal without changing steps
    // This will keep the user on the service selection page
    setShowErrorModal(false);
    setError(null);
  }

  function resetForm() {
    setTicketData(null);
    setError(null);
    setCurrentStep(1);
    setCountdown(5);
    setShowErrorModal(false); // Close modal when resetting
  }

  // Function to handle "Try Again" button in error modal
  function handleTryAgain() {
    setShowErrorModal(false);
    setError(null);

    // If we have a last service code, retry generating the ticket
    if (lastServiceCode) {
      handleGenerateTicket(lastServiceCode);
    }
  }

  // Add countdown effect when ticket is displayed
  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (currentStep === 3 && ticketData) {
      if (countdown > 0) {
        timer = setTimeout(() => {
          setCountdown(countdown - 1);
        }, 1000);
      } else {
        resetForm();
      }
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [currentStep, ticketData, countdown]);

  return (
    <div className="min-h-screen h-screen w-screen bg-gradient-to-br from-blue-50 via-cyan-100 to-blue-200 flex flex-col overflow-hidden relative">
      {" "}
      {showScreensaver ? (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center overflow-hidden z-50 backdrop-blur-lg">
          {" "}
          {screensaverImages.length > 0 ? (
            <div className="relative w-full h-full">
              {screensaverImages.map((image, index) => (
                <div
                  key={image.id}
                  className={`absolute inset-0 transition-opacity duration-1000 ${
                    index === currentImageIndex ? "opacity-100" : "opacity-0"
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
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="relative w-96 h-96 mb-8">
                <div className="absolute inset-0 bg-cyan-30 rounded-full blur-xl animate-pulse"></div>
                <Image
                  src="/wdlogo.png"
                  alt="GSCWD Logo"
                  width={384}
                  height={384}
                  className="relative w-full h-full object-contain drop-shadow-2xl"
                  priority
                />
              </div>
              <h1 className="text-5xl md:text-7xl font-bold text-white text-center mb-4 drop-shadow-lg">
                General Santos City Water District
              </h1>
              <div className="h-1 w-48 bg-cyan-300 rounded-full"></div>
            </div>
          )}
          {/* Animated waves overlay */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="wave wave1"></div>
            <div className="wave wave2"></div>
            <div className="wave wave3"></div>
            <div className="wave wave4"></div>
          </div>
          {/* Falling rain/water drops effect */}
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className={`raindrop raindrop-${i}`}></div>
          ))}
        </div>
      ) : (
        <>
          {/* Water-themed background effects */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <div className="absolute top-0 left-0 w-full h-24 bg-cyan-300 rounded-full blur-3xl transform -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-2/3 h-64 bg-blue-400 rounded-full blur-3xl transform translate-y-1/3"></div>
            <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-blue-300 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/3 left-1/6 w-96 h-32 bg-cyan-200 rounded-full blur-3xl"></div>
          </div>

          {/* Animated waves overlay */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="wave wave1"></div>
            <div className="wave wave2"></div>
            <div className="wave wave3"></div>
            <div className="wave wave4"></div>
          </div>

          {/* Falling rain/water drops effect */}
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className={`raindrop raindrop-${i}`}></div>
          ))}

          <div className="flex-1 flex items-center justify-center w-full h-full z-10">
            {/* Remove p-6, md:p-8, rounded-xl, border, border-blue-100 */}
            <div className="w-full h-full bg-white/80 backdrop-blur-sm flex flex-col shadow-2xl relative overflow-hidden">
              {/* Water ripple effect at the bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-blue-100/60 to-transparent"></div>

              {currentStep === 1 && (
                <div className="flex flex-col h-full">
                  {" "}
                  {/* Modern header design with water theme and improved styling */}
                  <div className="relative mb-8">
                    {" "}
                    {/* Header content with logo and text - centered vertically */}
                    <div className="relative flex justify-center items-center h-[500px] bg-gradient-to-r from-blue-700 to-cyan-500 rounded-b-[2rem] px-10 shadow-lg z-0 overflow-hidden">
                      {" "}
                      {/* Logo with water drop shadow effect */}
                      <div className="relative flex items-center gap-8">
                        <div className="relative">
                          <div className="absolute inset-0 bg-cyan-300/50 rounded-full blur-2xl"></div>
                          <img
                            src="/wdlogo.png"
                            alt="Water District Logo"
                            className="h-96 w-96 object-contain relative z-10 drop-shadow-2xl"
                          />
                        </div>
                        <div>
                          <h1 className="text-9xl font-bold text-white tracking-tight drop-shadow-lg">
                            Customer
                          </h1>
                          <h1 className="text-9xl font-bold text-white tracking-tight drop-shadow-lg">
                            Service
                          </h1>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Emphasized ticket system message with water-themed styling */}
                  <div className="relative mb-8 mt-10 text-center">
                    <p className="text-6xl md:text-8xl font-extrabold text-blue-700 drop-shadow-md">
                      GET YOUR NUMBER HERE
                    </p>
                    <p className="text-lg md:text-4xl text-blue-700 mt-4 drop-shadow-md">
                      Please select your user type to proceed.
                    </p>
                  </div>
                  {error && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 text-center shadow-md border border-red-100">
                      <p>{error}</p>
                      <button
                        onClick={resetForm}
                        className="mt-2 text-red-600 underline"
                      >
                        Try again
                      </button>
                    </div>
                  )}
                  <div className="flex-1 flex flex-col justify-center">
                    <h2 className="text-2xl font-semibold text-blue-800 text-center mb-6 drop-shadow-sm"></h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow p-10">
                      <button
                        onClick={() => selectUserType(true)}
                        className="flex flex-col items-center justify-center text-white bg-gradient-to-br from-blue-400 to-cyan-500 border-2 border-blue-200 hover:border-blue-500 hover:from-blue-50 hover:to-cyan-50 hover:text-blue-800 font-bold py-12 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl focus:ring-4 focus:ring-cyan-300 relative overflow-hidden group"
                      >
                        {/* Water ripple effect on hover */}
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxNXB4IiB2aWV3Qm94PSIwIDAgMTI4MCAxNDAiIHByZXNlcnZlQXNwZWN0UmF0aW89Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0iI2ZmZmZmZiI+PHBhdGggZD0iTTMyMCAyOGM0NCAwIDExMi0yOSAyMDItMjggNzMgMCAxMzMgNDkgMTggNzAgMCAzIDIwLTEzIDU1LTEzIDMyIDAgODMgMjAgMTM0IDIwIDM0IDAgMTQzLTMzIDE0My0zM3YxNDBIMHptNTIxIDY4YzAgMC0xNTkgNDItMzE5IDQyLTE4MCAwLTM0MS02Ni0zNDEtNjZ2MTZIMTQ0MFY2MGMwIDAgMTQtMTQgMzktMjkgOS00IDE2LTggMjUtMTQgNDAtMjQgNTUtMTIgOTgtNDIgNDgtMzAgMTQzIDE0IDE0MyAxNHoiLz48L2c+PC9zdmc+')] bg-center [background-size:100%] bottom-0 left-0 right-0 h-16 opacity-0 group-hover:opacity-20 transition-opacity duration-700"></div>

                        <div className="items-center justify-center mb-6 relative">
                          <Wheelchair
                            size={350}
                            weight="bold"
                            className="drop-shadow-xl transition-transform group-hover:scale-110 duration-300"
                          />
                          <span className="text-7xl invisible block">
                            SPACER
                          </span>
                          <span className="text-7xl invisible block">
                            SPACER
                          </span>
                        </div>
                        <div className="text-center drop-shadow-md">
                          <span className="text-7xl block">PWD</span>
                          <span className="text-7xl block">PREGNANT</span>
                          <span className="text-7xl block">SENIOR CITIZEN</span>
                        </div>
                      </button>
                      <button
                        onClick={() => selectUserType(false)}
                        className="flex flex-col items-center justify-center text-white bg-gradient-to-br from-blue-400 to-cyan-500 border-2 border-blue-200 hover:border-blue-500 hover:from-blue-50 hover:to-cyan-50 hover:text-blue-800 font-bold py-12 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl focus:ring-4 focus:ring-cyan-300 relative overflow-hidden group"
                      >
                        {/* Water ripple effect on hover */}
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxNXB4IiB2aWV3Qm94PSIwIDAgMTI4MCAxNDAiIHByZXNlcnZlQXNwZWN0UmF0aW89Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0iI2ZmZmZmZiI+PHBhdGggZD0iTTMyMCAyOGM0NCAwIDExMi0yOSAyMDItMjggNzMgMCAxMzMgNDkgMTggNzAgMCAzIDIwLTEzIDU1LTEzIDMyIDAgODMgMjAgMTM0IDIwIDM0IDAgMTQzLTMzIDE0My0zM3YxNDBIMHptNTIxIDY4YzAgMC0xNTkgNDItMzE5IDQyLTE4MCAwLTM0MS02Ni0zNDEtNjZ2MTZIMTQ0MFY2MGMwIDAgMTQtMTQgMzktMjkgOS00IDE2LTggMjUtMTQgNDAtMjQgNTUtMTIgOTgtNDIgNDgtMzAgMTQzIDE0IDE0MyAxNHoiLz48L2c+PC9zdmc+')] bg-center [background-size:100%] bottom-0 left-0 right-0 h-16 opacity-0 group-hover:opacity-20 transition-opacity duration-700"></div>

                        <div className="items-center justify-center">
                          <User
                            size={350}
                            className="drop-shadow-xl transition-transform group-hover:scale-110 duration-300"
                          />
                          <span className="text-7xl invisible block">
                            SPACER
                          </span>
                          <span className="text-7xl invisible block">
                            SPACER
                          </span>
                          <span className="text-7xl invisible block">
                            SPACER
                          </span>
                        </div>
                        <div className="text-center drop-shadow-md">
                          <span className="text-7xl block">REGULAR</span>
                          <span className="text-7xl invisible block">
                            SPACER
                          </span>
                          <span className="text-7xl invisible block">
                            SPACER
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="flex flex-col h-full mt-6">
                  {" "}
                  {/* Added padding */}
                  {/* Service selection page with water theme */}
                  <div className="flex-1 grid gap-8 mx-8">
                    {" "}
                    {/* Increased gap and added margin */}
                    {services.map((service) => (
                      <button
                        key={service.code}
                        onClick={() =>
                          handleGenerateTicket(
                            isPWD ? `PWD-${service.code}` : service.code
                          )
                        }
                        className="bg-gradient-to-r from-blue-400 to-cyan-500 border text-white border-blue-200 hover:border-blue-500 hover:text-blue-800 hover:from-blue-50 hover:to-cyan-50 rounded-xl p-12 flex flex-col h-full transition-all duration-300 shadow-lg hover:shadow-xl focus:ring-4 focus:ring-cyan-300 relative overflow-hidden group"
                      >
                        {/* Water ripple effect on hover */}
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxNXB4IiB2aWV3Qm94PSIwIDAgMTI4MCAxNDAiIHByZXNlcnZlQXNwZWN0UmF0aW89Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0iI2ZmZmZmZiI+PHBhdGggZD0iTTMyMCAyOGM0NCAwIDExMi0yOSAyMDItMjggNzMgMCAxMzMgNDkgMTggNzAgMCAzIDIwLTEzIDU1LTEzIDMyIDAgODMgMjAgMTM0IDIwIDM0IDAgMTQzLTMzIDE0My0zM3YxNDBIMHptNTIxIDY4YzAgMC0xNTkgNDItMzE5IDQyLTE4MCAwLTM0MS02Ni0zNDEtNjZ2MTZIMTQ0MFY2MGMwIDAgMTQtMTQgMzktMjkgOS00IDE2LTggMjUtMTQgNDAtMjQgNTUtMTIgOTgtNDIgNDgtMzAgMTQzIDE0IDE0MyAxNHoiLz48L2c+PC9zdmc+')] bg-center [background-size:100%] bottom-0 left-0 right-0 h-16 opacity-0 group-hover:opacity-20 transition-opacity duration-700"></div>
                        <div className="flex-1 flex items-center justify-center">
                          <h3 className="text-7xl font-bold text-center drop-shadow-md">
                            {service.name}
                          </h3>
                        </div>
                        {service.description && (
                          <p className="font-bold text-cyan-600 text-center mb-4">
                            {service.description}
                          </p>
                        )}
                        <div className="flex justify-center">
                          {/* <span className="inline-flex items-center px-6 py-5 bg-sky-100 text-sky-800 rounded-full text-lg font-bold">
                      {isPWD ? `PWD-${service.code}` : `${service.code}`}
                      </span> */}
                        </div>
                      </button>
                    ))}
                  </div>
                  {/* Big back button at the bottom */}
                  <div className="mt-8 mx-8 mb-6">
                    {" "}
                    {/* Added margins */}
                    <button
                      onClick={goBack}
                      className="w-full flex items-center justify-center font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-xl py-8 px-8 text-3xl transition-all duration-300 shadow-lg hover:shadow-xl relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIyMHB4IiB2aWV3Qm94PSIwIDAgMTI4MCAxNDAiIHByZXNlcnZlQXNwZWN0UmF0aW89Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0iI2ZmZmZmZiI+PHBhdGggZD0iTTMyMCAyOGM0NCAwIDExMi0yOSAyMDItMjggNzMgMCAxMzMgNDkgMTggNzAgMCAzIDIwLTEzIDU1LTEzIDMyIDAgODMgMjAgMTM0IDIwIDM0IDAgMTQzLTMzIDE0My0zM3YxNDBIMHptNTIxIDY4YzAgMC0xNTkgNDItMzE5IDQyLTE4MCAwLTM0MS02Ni0zNDEtNjZ2MTZIMTQ0MFY2MGMwIDAgMTQtMTQgMzktMjkgOS00IDE2LTggMjUtMTQgNDAtMjQgNTUtMTIgOTgtNDIgNDgtMzAgMTQzIDE0IDE0MyAxNHoiLz48L2c+PC9zdmc+')] bg-center [background-size:100%] bottom-0 left-0 right-0 h-16 opacity-0 group-hover:opacity-30 transition-opacity duration-700"></div>
                      <ArrowLeftIcon className="h-8 w-8 mr-4" />
                      <span>Back to Customer Type Selection</span>
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 3 && ticketData && (
                <div className="text-center space-y-6 animate-fade-in flex-1 flex flex-col justify-center px-1 py-2">
                  <div className="bg-gradient-to-br flex-1 from-blue-50 to-cyan-100 rounded-xl p-64 border border-blue-200 shadow-lg relative overflow-hidden">
                    {/* Bubble effect in the background */}
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute animate-float top-1/4 left-1/4 w-32 h-32 bg-blue-300 rounded-full blur-xl"></div>
                      <div className="absolute animate-float-delayed top-3/4 right-1/4 w-24 h-24 bg-cyan-300 rounded-full blur-xl"></div>
                      <div className="absolute animate-float-slow bottom-1/4 right-1/3 w-16 h-16 bg-blue-200 rounded-full blur-lg"></div>
                    </div>

                    <h2 className="text-3xl mt-96 font-bold text-blue-600 mb-4 drop-shadow-md relative">
                      YOUR TICKET NUMBER
                    </h2>
                    <div className="text-[83px] font-bold text-blue-800 animate-pop-in mb-4 drop-shadow-xl relative">
                      {formatTicketNumber(
                        ticketData.ticketNumber,
                        ticketData.isPrioritized
                      )}
                    </div>

                    {ticketData.counterName && (
                      <div className="mt-6 text-blue-700 relative">
                        <p className="font-medium text-xl drop-shadow-sm">
                          Assigned to: {ticketData.counterName}
                        </p>
                        <p className="text-md text-blue-600 mt-2">
                          Please proceed to this counter
                        </p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={resetForm}
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-bold py-4 px-6 text-3xl rounded-lg transition-all duration-300 focus:ring-4 focus:ring-cyan-300 focus:ring-offset-2 shadow-lg hover:shadow-xl relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIyMHB4IiB2aWV3Qm94PSIwIDAgMTI4MCAxNDAiIHByZXNlcnZlQXNwZWN0UmF0aW89Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0iI2ZmZmZmZiI+PHBhdGggZD0iTTMyMCAyOGM0NCAwIDExMi0yOSAyMDItMjggNzMgMCAxMzMgNDkgMTggNzAgMCAzIDIwLTEzIDU1LTEzIDMyIDAgODMgMjAgMTM0IDIwIDM0IDAgMTQzLTMzIDE0My0zM3YxNDBIMHptNTIxIDY4YzAgMC0xNTkgNDItMzE5IDQyLTE4MCAwLTM0MS02Ni0zNDEtNjZ2MTZIMTQ0MFY2MGMwIDAgMTQtMTQgMzktMjkgOS00IDE2LTggMjUtMTQgNDAtMjQgNTUtMTIgOTgtNDIgNDgtMzAgMTQzIDE0IDE0MyAxNHoiLz48L2c+PC9zdmc+')] bg-center [background-size:100%] bottom-0 left-0 right-0 h-16 opacity-0 group-hover:opacity-30 transition-opacity duration-700"></div>
                    Get Another Ticket ({countdown})
                  </button>
                </div>
              )}

              {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50/90 to-cyan-100/90 backdrop-blur-sm z-50">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-blue-300 blur-xl animate-pulse"></div>
                    <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full relative"></div>
                  </div>
                  <p className="mt-4 text-blue-700 text-xl font-semibold drop-shadow-sm">
                    Generating your ticket...
                  </p>
                </div>
              )}

              {/* Error Modal */}
              {showErrorModal && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50 backdrop-blur-sm">
                  <div className="bg-white rounded-xl p-8 shadow-2xl w-full max-w-md mx-4 animate-bounce-in">
                    <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
                      <div className="flex items-center justify-center mb-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-12 w-12 text-red-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-center mb-2">
                        Error Occurred
                      </h3>
                      <p className="text-center">
                        {errorMessage ||
                          "Failed to generate ticket. Please try again."}
                      </p>
                    </div>{" "}
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={handleTryAgain}
                        className="px-4 py-3 bg-blue-100 hover:bg-blue-200 text-blue-700 font-medium rounded-lg transition-colors duration-200"
                      >
                        Try Again
                      </button>
                      <button
                        onClick={goBack}
                        className="px-4 py-3 bg-red-100 hover:bg-red-200 text-red-700 font-medium rounded-lg transition-colors duration-200"
                      >
                        Back
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
      <style jsx global>{`
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
          animation: float-delayed 6s ease-in-out infinite 1s;
        }
        .animate-float-slow {
          animation: float-slow 10s ease-in-out infinite 2s;
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
          animation: pop-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
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
          animation: fade-in 0.6s ease-in-out forwards;
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
          animation: bounce-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)
            forwards;
        }

        /* Add smooth scrolling behavior */
        .screensaver-content {
          scroll-behavior: smooth;
        }

        /* Update wave animations for fixed positioning */
        .wave {
          position: fixed;
          bottom: 0;
          left: 0;
          width: 200%;
          height: 100px;
          background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%230099ff' fill-opacity='0.2' d='M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E")
            repeat-x;
          background-size: 100% 100px;
          animation: wave-animation 12s linear infinite;
        }

        .wave1 {
          bottom: -25px;
          opacity: 0.3;
          animation: wave-animation 10s linear infinite;
        }

        .wave2 {
          bottom: -35px;
          opacity: 0.2;
          animation: wave-animation 14s linear reverse infinite;
          background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%2300ccff' fill-opacity='0.2' d='M0,64L48,80C96,96,192,128,288,138.7C384,149,480,139,576,144C672,149,768,171,864,165.3C960,160,1056,128,1152,117.3C1248,107,1344,117,1392,122.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E")
            repeat-x;
        }

        .wave3 {
          bottom: -45px;
          opacity: 0.15;
          animation: wave-animation 17s linear infinite;
          background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1440 320'%3E%3Cpath fill='%230088ff' fill-opacity='0.2' d='M0,96L48,112C96,128,192,160,288,186.7C384,213,480,235,576,218.7C672,203,768,149,864,154.7C960,160,1056,224,1152,218.7C1248,213,1344,139,1392,101.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z'%3E%3C/path%3E%3C/svg%3E")
            repeat-x;
        }

        .wave4 {
          bottom: -55px;
          opacity: 0.1;
          animation: wave-animation 20s linear reverse infinite;
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

        /* Raindrop positions */
        ${Array.from({ length: 20 })
          .map(
            (_, i) => `
          .raindrop-${i} {
            left: ${Math.random() * 100}%;
            animation-delay: ${Math.random() * 5}s;
            animation-duration: ${Math.random() * 3 + 2}s;
          }
        `
          )
          .join("")}
      `}</style>
    </div>
  );
}
