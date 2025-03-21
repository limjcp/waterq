"use client";
import React, { useState, useEffect } from "react";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { Accessibility, User } from "lucide-react";

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
  // Step tracking (1: Choose PWD/Regular, 2: Select Service, 3: Show Ticket)
  const [currentStep, setCurrentStep] = useState(1);
  const [ticketData, setTicketData] = useState<TicketResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPWD, setIsPWD] = useState(false);
  const [countdown, setCountdown] = useState(5);

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
    <div className="min-h-screen h-screen w-screen bg-gradient-to-br from-sky-50 to-sky-100 flex flex-col overflow-hidden">
      <div className="flex-1 flex items-center justify-center w-full h-full">
        <div className="w-full h-full bg-white p-6 md:p-8 flex flex-col">
          <div className="text-center mb-6 md:mb-8">
            <img
              src="/wdlogo.png"
              alt="Ticket Icon"
              className="h-96 w-96 text-sky-500 mx-auto mb-1 md:mb-2"
            />

            <h1 className="text-5xl md:text-8xl font-bold text-sky-800 mb-1 md:mb-2">
              Customer Kiosk
            </h1>

            <p className="text-sky-600 text-lg md:text-xl">
              Get your digital queue ticket
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 text-center">
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
            {currentStep === 1 && (
              <div className="space-y-6 flex-1 flex flex-col justify-center">
                <h2 className="text-2xl font-semibold text-sky-800 text-center mb-6">
                  Please select your customer type
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-grow">
                  <button
                    onClick={() => selectUserType(true)}
                    className="flex flex-col items-center justify-center text-white bg-sky-400 border-2 border-sky-200 hover:border-sky-500 hover:bg-sky-50 hover:text-black font-bold py-12 px-6 rounded-xl transition-all duration-200 focus:ring-4 focus:ring-sky-300"
                  >
                    <div className="flex-1 flex items-center justify-center mb-6">
                      <Accessibility size={350} />
                    </div>
                    <div className="text-center">
                      <span className="text-7xl block">PWD</span>
                      <span className="text-7xl block">PREGNANT</span>
                      <span className="text-7xl block">SENIOR CITIZEN</span>
                    </div>
                  </button>
                  <button
                    onClick={() => selectUserType(false)}
                    className="flex flex-col items-center justify-center text-white bg-sky-400 border-2 border-sky-200 hover:border-sky-500 hover:bg-sky-50 hover:text-black font-bold py-12 px-6 rounded-xl transition-all duration-200 focus:ring-4 focus:ring-sky-300"
                  >
                    <div className="flex-1 flex items-center justify-center mb-6">
                      <User size={350} />
                    </div>
                    <div className="text-center">
                      <span className="text-7xl block">REGULAR</span>
                      <span className="text-7xl invisible block">SPACER</span>
                      <span className="text-7xl invisible block">SPACER</span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6 flex-1 flex flex-col">
                <div className="flex items-center mb-6">
                  <button
                    onClick={goBack}
                    className="flex items-center font-bold text-white hover:text-sky-800 transition-colors bg-sky-400 rounded-full p-3"
                  >
                    <ArrowLeftIcon className="h-5 w-5 mr-2" />
                    <span>Back</span>
                  </button>
                  <h2 className="text-2xl font-semibold text-white flex-grow text-center pr-10">
                    {isPWD ? "PWD Services" : "Regular Services"}
                  </h2>
                </div>

                <div className="grid gap-4 flex-1 overflow-y-auto">
                  {services.map((service) => (
                    <button
                      key={service.code}
                      onClick={() =>
                        handleGenerateTicket(
                          isPWD ? `PWD-${service.code}` : service.code
                        )
                      }
                      className="bg-sky-400 border text-white border-sky-200 hover:border-sky-500 hover:text-black hover:bg-sky-50 rounded-xl p-6 flex flex-col h-64 transition-all duration-200 focus:ring-4 focus:ring-sky-300"
                    >
                      <div className="flex-1 flex items-center justify-center">
                        <h3 className="text-7xl font-bold text-center">
                          {service.name}
                        </h3>
                      </div>
                      {service.description && (
                        <p className="font-bold text-sky-600 text-center mb-4">
                          {service.description}
                        </p>
                      )}
                      <div className="flex justify-center">
                        <span className="inline-flex items-center px-6 py-5 bg-sky-100 text-sky-800 rounded-full text-lg font-bold">
                          {isPWD ? `PWD-${service.code}` : `${service.code}`}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 3 && ticketData && (
              <div className="text-center space-y-6 animate-fade-in flex-1 flex flex-col justify-center">
                <div className="bg-sky-50 rounded-xl p-64 border border-sky-100">
                  <h2 className="text-3xl font-bold text-sky-600 mb-4">
                    YOUR TICKET NUMBER
                  </h2>
                  <div className="text-9xl font-bold text-sky-800 animate-pop-in mb-4">
                    {formatTicketNumber(
                      ticketData.ticketNumber,
                      ticketData.isPrioritized
                    )}
                  </div>

                  {ticketData.counterName && (
                    <div className="mt-6 text-sky-700">
                      <p className="font-medium text-xl">
                        Assigned to: {ticketData.counterName}
                      </p>
                      <p className="text-md text-sky-600 mt-2">
                        Please proceed to this counter
                      </p>
                    </div>
                  )}
                </div>
                <button
                  onClick={resetForm}
                  className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-4 px-6 text-3xl rounded-lg transition-colors duration-200 focus:ring-4 focus:ring-sky-300 focus:ring-offset-2"
                >
                  Get Another Ticket ({countdown})
                </button>
              </div>
            )}
          </div>

          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-50">
              <div className="animate-spin h-12 w-12 border-4 border-sky-500 border-t-transparent rounded-full"></div>
              <p className="mt-4 text-sky-700 text-xl">
                Generating your ticket...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
