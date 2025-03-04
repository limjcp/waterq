"use client";
import React, { useState, useEffect } from "react";
import { TicketIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import { Accessibility, User } from "lucide-react";

// Add utility function for ticket formatting
function formatTicketNumber(ticketNumber: string): string {
  if (!ticketNumber) return "";

  // If already has a dash, return as is
  if (ticketNumber.includes("-")) return ticketNumber;

  // Find where the numbers start
  const numberIndex = ticketNumber.search(/\d/);
  if (numberIndex === -1) return ticketNumber;

  // Split prefix and number
  const prefix = ticketNumber.substring(0, numberIndex);
  const number = ticketNumber.substring(numberIndex);

  return `${prefix}-${number}`;
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
  const [selectedCounterCode, setSelectedCounterCode] = useState("");
  const [ticketData, setTicketData] = useState<TicketResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPWD, setIsPWD] = useState(false);
  const [countdown, setCountdown] = useState(999);

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

  async function handleGenerateTicket(serviceCode: string) {
    setSelectedCounterCode(serviceCode);
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
              Service Kiosk
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
                    className="flex flex-col items-center justify-center bg-sky-400 border-2 border-sky-200 hover:border-sky-500 hover:bg-sky-50 text-sky-800 font-bold py-12 px-6 rounded-xl transition-all duration-200 focus:ring-4 focus:ring-sky-300"
                  >
                    <span>
                      <img
                        src="push.png"
                        alt="Accessibility Icon"
                        className="h-52 w-52 mx-auto mb-4"
                      />
                    </span>
                    <span className="text-8xl text-white">PWD</span>
                  </button>
                  <button
                    onClick={() => selectUserType(false)}
                    className="flex flex-col items-center justify-center bg-sky-400 border-2 border-sky-200 hover:border-sky-500 hover:bg-sky-50 text-sky-800 font-bold py-12 px-6 rounded-xl transition-all duration-200 focus:ring-4 focus:ring-sky-300"
                  >
                    <span>
                      <img
                        src="users.png"
                        alt="Accessibility Icon"
                        className="h-52 w-52 mx-auto mb-4"
                      />
                    </span>
                    <span className="text-8xl text-white">REGULAR</span>
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
                      className="bg-sky-400 border border-sky-200 hover:border-sky-500 hover:bg-sky-50 rounded-xl p-6 text-left transition-all duration-200 focus:ring-4 focus:ring-sky-300"
                    >
                      <h3 className="text-7xl font-bold text-white mb-10">
                        {service.name}
                      </h3>
                      <p className="font-bold text-sky-600">
                        {service.description}
                      </p>
                      <div className="mt-3 flex justify-end">
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
                    {formatTicketNumber(ticketData.ticketNumber)}
                  </div>

                  <div className="mt-3 inline-flex items-center px-4 py-2 bg-sky-500 text-white rounded-full text-2xl font-medium animate-fade-in">
                    {ticketData.isPrioritized
                      ? `PWD-${formatTicketNumber(
                          ticketData.ticketNumber.split("-").pop() ||
                            ticketData.ticketNumber
                        )}`
                      : formatTicketNumber(ticketData.ticketNumber)}
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
