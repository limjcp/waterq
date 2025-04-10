"use client";
import React, { useState, useEffect } from "react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { User } from "lucide-react";
import { Wheelchair} from "@phosphor-icons/react";
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
  const [screensaverImages, setScreensaverImages] = useState<Array<{ id: string; imageUrl: string; title: string }>>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

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
        const res = await fetch('/api/screensaver');
        const data = await res.json();
        // Only keep active images
        const activeImages = data.filter((img: any) => img.isActive === true); 
        setScreensaverImages(activeImages);
      } catch (error) {
        console.error('Failed to fetch screensaver images:', error);
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
  ];

  // Add print function
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
              size: 80mm 60mm;
              margin: 0;
            }
            html, body {
              margin: 0;
              padding: 0;
              width: 80mm;
              height: 60mm;
              overflow: hidden;
            }
            .ticket {
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              height: 60mm;
              text-align: center;
            }
            .ticket-number {
              font-size: 36px;
              font-weight: bold;
              font-family: 'Courier New', monospace;
              margin: 0;
              line-height: 1.2;
            }
            .timestamp {
              font-size: 14px;
              font-family: 'Courier New', monospace;
              margin-top: 8px;
            }
            @media print {
              @page {
                margin: 0;
              }
              html, body {
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
          <div class="ticket">
            <div class="ticket-number">${formatTicketNumber(
              ticket.ticketNumber,
              ticket.isPrioritized
            )}</div>
            <div class="timestamp">
              ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
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
    setIsLoading(true);
    setError(null);

    try {
      // Extract the actual service code without the PWD prefix if present
      const actualServiceCode = serviceCode.replace("PWD-", "");

      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceCode: actualServiceCode,
          isPrioritized: isPWD,
        }),
      });

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
      setError(
        err instanceof Error ? err.message : "Failed to generate ticket"
      );
    } finally {
      setIsLoading(false);
    }
  }

  function selectUserType(isPWD: boolean) {
    setIsPWD(isPWD);
    setCurrentStep(2);
  }

  function goBack() {
    setCurrentStep(1);
    setError(null);
  }

  function resetForm() {
    setTicketData(null);
    setError(null);
    setCurrentStep(1);
    setCountdown(5);
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
      {showScreensaver ? (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-cyan-600 flex flex-col items-center justify-center overflow-hidden z-50 backdrop-blur-lg">
          {screensaverImages.length > 0 ? (
            <div className="relative w-full h-full">
              {screensaverImages.map((image, index) => (
                <div
                  key={image.id}
                  className={`absolute inset-0 transition-opacity duration-1000 ${
                    index === currentImageIndex ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  <img
                    src={image.imageUrl}
                    alt={image.title}
                    className="w-full h-full object-contain"
                  />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Header with logo and name - keep fixed */}
              <div className="fixed top-0 left-0 right-0 z-10 bg-gradient-to-b from-blue-600 to-transparent pt-8 pb-16">
                <div className="flex flex-col items-center">
                  <div className="relative w-48 h-48 mb-4">
                    <div className="absolute inset-0 bg-cyan-300 rounded-full blur-xl animate-pulse"></div>
                    <Image
                      src="/wdlogo.png"
                      alt="GSCWD Logo"
                      width={192}
                      height={192}
                      className="relative w-full h-full object-contain drop-shadow-2xl"
                      priority
                    />
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-2 drop-shadow-lg">
                    General Santos City Water District
                  </h1>
                  <div className="h-1 w-32 bg-cyan-300 rounded-full"></div>
                </div>
              </div>

              {/* Scrolling content container */}
              <div className="screensaver-content flex-1 w-full max-w-4xl mx-auto px-6 overflow-hidden text-white space-y-8 mt-[32rem]">
                <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl">
                  <h2 className="text-2xl font-semibold mb-4">Our History</h2>
                  <p className="text-lg leading-relaxed">
                    On August 21, 7, the General Santos City Water District
                    (GSCWD) was organized through Sangguniang Panlungsod (SP) Board
                    Resolution No. 116, as amended, SP Board Resolution No. 224
                    series of 1987 pursuant to the provision of Section 3, 27, and
                    45 of Titles I and II of Presidential Decree 198, as amended
                    otherwise known as the Provincial Water Utilities Act of 1973
                    signed by former President Ferdinand E. Marcos, LWUA later
                    issued a Conditional Certificate of Conformance (CCC) No. 370 on
                    November 29, 1988 to establish the water district.
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl">
                  <h2 className="text-2xl font-semibold mb-4">
                    Growth and Service
                  </h2>
                  <p className="text-lg leading-relaxed">
                    For 29 years from the formation of the GSCWD in the city, the
                    district has now active service connections of 42,503 as of
                    November 2016 and has 161 employees.
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl">
                  <h2 className="text-2xl font-semibold mb-4">
                    Corporate Social Responsibility
                  </h2>
                  <p className="text-lg leading-relaxed">
                    Along with the GSCWD's mandate of providing safe and potable
                    water, it is highly committed to fulfill its corporate social
                    responsibility. It actively participated in the protection of
                    water resources through the adoption of protected areas and
                    established projects for watershed development. It extended
                    special projects such as donations of school building for the
                    children in the remote areas and sustained the need of a child
                    to access quality health through the support and adoption of the
                    Neonatal Intensive Care Unit (NICU) project at the General
                    Santos City District Hospital.
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl">
                  <h2 className="text-2xl font-semibold mb-4">
                    Awards and Recognition
                  </h2>
                  <p className="text-lg leading-relaxed">
                    The General Santos City Water District has been awarded by the
                    Local Water Utilities Administration as the Most Outstanding
                    Water District – Medium Category, Mindanao for exemplary
                    performance in providing water services to the community with
                    sustained superior levels of institutional and financial
                    viability for the year 2007.
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-sm p-6 rounded-xl">
                  <h2 className="text-2xl font-semibold mb-4">
                    Contact Information
                  </h2>
                  <div className="space-y-2 text-lg">
                    <p>
                      E. Fernandez St., Brgy. Lagao, General Santos City, 9500,
                      Philippines
                    </p>
                    <p>Customer hotline: (083) 552 3824</p>
                    <p>Mobile Numbers:</p>
                    <ul className="list-disc list-inside pl-4">
                      <li>0998 5307 893</li>
                      <li>0998 8485 714</li>
                      <li>0917 7049 979</li>
                      <li>0917 7049 867</li>
                    </ul>
                  </div>
                </div>

                <div className="flex justify-center space-x-8 py-8">
                  <Image
                    src="/transparency-seal.png"
                    alt="Transparency Seal"
                    width={64}
                    height={64}
                    className="h-16"
                  />
                  <Image
                    src="/foi-logo.png"
                    alt="FOI Logo"
                    width={64}
                    height={64}
                    className="h-16"
                  />
                  <Image
                    src="/philgeps-logo.png"
                    alt="PhilGEPS Logo"
                    width={64}
                    height={64}
                    className="h-16"
                  />
                </div>

                <div className="text-center text-sm opacity-75">
                  <p>All rights reserved © General Santos City Water District</p>
                  <p>©2021 General Santos Water District</p>
                </div>
              </div>

              {/* Fixed gradient overlays for smooth transitions */}
              <div className="fixed top-0 left-0 right-0 h-32 bg-gradient-to-b from-blue-600 to-transparent pointer-events-none"></div>
              <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-cyan-600 to-transparent pointer-events-none"></div>

              {/* Animated water waves */}
              <div className="fixed bottom-0 left-0 right-0 pointer-events-none">
                <div className="wave wave1"></div>
                <div className="wave wave2"></div>
                <div className="wave wave3"></div>
              </div>
            </>
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
            <div className="w-full h-full bg-white/80 backdrop-blur-sm p-6 md:p-8 flex flex-col shadow-2xl rounded-xl border border-blue-100 relative overflow-hidden">
              {/* Water ripple effect at the bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-blue-100/60 to-transparent"></div>

              {currentStep === 1 && (
                <div className="flex flex-col h-full">
                  {/* Modern header design with water theme and improved styling */}
                  <div className="relative mb-8">
                    {/* Background accent element with water wave effect */}
                    <div className="absolute -left-6 -top-6 -right-6 h-96 bg-gradient-to-r from-blue-700 to-cyan-500 rounded-b-3xl shadow-lg z-0 overflow-hidden">
                      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIyMHB4IiB2aWV3Qm94PSIwIDAgMTI4MCAxNDAiIHByZXNlcnZlQXNwZWN0UmF0aW89Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0iI2ZmZmZmZiI+PHBhdGggZD0iTTEyODAgMEw2NDAgNzAgMCAwdjE0MGgxMjgweiIvPjwvZz48L3N2Zz4=')] bottom -1px repeat-x transform translate-y-8 opacity-20"></div>
                    </div>

                    {/* Header content with logo and text */}
                    <div className="relative z-10 flex items-center pt-6 px-4">
                      {/* Logo with water drop shadow effect */}
                      <div className="relative">
                        <div className="absolute -inset-1 bg-cyan-200 rounded-full blur-md"></div>
                        <img
                          src="/wdlogo.png"
                          alt="Water District Logo"
                          className="h-64 w-64 object-contain relative z-10 drop-shadow-lg"
                        />
                      </div>
                      <div className="ml-4">
                        <h1 className="text-7xl md:text-7xl font-bold text-white tracking-tight drop-shadow-md">
                          Customer Service
                        </h1>
                        
                      </div>
                    </div>
                  </div>

                  {/* Emphasized ticket system message with water-themed styling */}
                  <div className="relative mb-8 mt-16 text-center">
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
                    <h2 className="text-2xl font-semibold text-blue-800 text-center mb-6 drop-shadow-sm">
                    
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
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
                <div className="flex flex-col h-full">
                  {/* Service selection page with water theme */}
                  <div className="flex-1 grid gap-4">
                    {services.map((service) => (
                      <button
                        key={service.code}
                        onClick={() =>
                          handleGenerateTicket(
                            isPWD ? `PWD-${service.code}` : service.code
                          )
                        }
                        className="bg-gradient-to-r from-blue-400 to-cyan-500 border text-white border-blue-200 hover:border-blue-500 hover:text-blue-800 hover:from-blue-50 hover:to-cyan-50 rounded-xl p-6 flex flex-col h-full transition-all duration-300 shadow-lg hover:shadow-xl focus:ring-4 focus:ring-cyan-300 relative overflow-hidden group"
                      >
                        {/* Water ripple effect on hover */}
                        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxNXB4IiB2aWV3Qm94PSIwIDAgMTI4MCAxNDAiIHByZXNlcnZlQXNwZWN0UmF0aW89Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0iI2ZmZmZmZiI+PHBhdGggZD0iTTMyMCAyOGM0NCAwIDExMi0yOSAyMDItMjggNzMgMCAxMzMgNDkgMTggNzAgMCAzIDIwLTEzIDU1LTEzIDMyIDAgODMgMjAgMTM0IDIwIDM0IDAgMTQzLTMzIDE0My0zM3YxNDBIMHptNTIxIDY4YzAgMC0xNTkgNDItMzE5IDQyLTE4MCAwLTM0MS02Ni0zNDEtNjZ2MTZIMTQ0MFY2MGMwIDAgMTQtMTQgMzktMjkgOS00IDE2LTggMjUtMTQgNDAtMjQgNTUtMTIgOTgtNDIgNDgtMzAgMTQzIDE0IDE0MyAxNHoiLz48L2c+')] bg-center [background-size:100%] bottom-0 left-0 right-0 h-16 opacity-0 group-hover:opacity-20 transition-opacity duration-700"></div>
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
                  <div className="mt-6">
                    <button
                      onClick={goBack}
                      className="w-full flex items-center justify-center font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-xl py-6 px-8 text-3xl transition-all duration-300 shadow-lg hover:shadow-xl relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIyMHB4IiB2aWV3Qm94PSIwIDAgMTI4MCAxNDAiIHByZXNlcnZlQXNwZWN0UmF0aW89Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGcgZmlsbD0iI2ZmZmZmZiI+PHBhdGggZD0iTTMyMCAyOGM0NCAwIDExMi0yOSAyMDItMjggNzMgMCAxMzMgNDkgMTggNzAgMCAzIDIwLTEzIDU1LTEzIDMyIDAgODMgMjAgMTM0IDIwIDM0IDAgMTQzLTMzIDE0My0zM3YxNDBIMHptNTIxIDY4YzAgMC0xNTkgNDItMzE5IDQyLTE4MCAwLTM0MS02Ni0zNDEtNjZ2MTZIMTQ0MFY2MGMwIDAgMTQtMTQgMzktMjkgOS00IDE2LTggMjUtMTQgNDAtMjQgNTUtMTIgOTgtNDIgNDgtMzAgMTQzIDE0IDE0MyAxNHoiLz48L2c+PC9zdmc+')] bg-center [background-size:100%] bottom-0 left-0 right-0 h-16 opacity-0 group-hover:opacity-30 transition-opacity duration-700"></div>
                      <ArrowLeftIcon className="h-8 w-8 mr-4" />
                      <span>Back to Customer Type Selection</span>
                    </button>
                  </div>
                </div>
              )}

              {currentStep === 3 && ticketData && (
                <div className="text-center space-y-6 animate-fade-in flex-1 flex flex-col justify-center">
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-xl p-64 border border-blue-200 shadow-lg relative overflow-hidden">
                    {/* Bubble effect in the background */}
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute animate-float top-1/4 left-1/4 w-32 h-32 bg-blue-300 rounded-full blur-xl"></div>
                      <div className="absolute animate-float-delayed top-3/4 right-1/4 w-24 h-24 bg-cyan-300 rounded-full blur-xl"></div>
                      <div className="absolute animate-float-slow bottom-1/4 right-1/3 w-16 h-16 bg-blue-200 rounded-full blur-lg"></div>
                    </div>

                    <h2 className="text-3xl font-bold text-blue-600 mb-4 drop-shadow-md relative">
                      YOUR TICKET NUMBER
                    </h2>
                    <div className="text-9xl font-bold text-blue-800 animate-pop-in mb-4 drop-shadow-xl relative">
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
