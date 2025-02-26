"use client";
import React, { useState } from "react";
import { TicketIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";

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

  const services: ServiceOption[] = [
    {
      code: "CW",
      name: "Customer Welfare",
      description: "Questions, concerns and general inquiries",
    },
    {
      code: "NSA",
      name: "New Service Application",
      description: "Apply for new water service connections",
    },
    {
      code: "P",
      name: "Payment",
      description: "Bill payments and financial transactions",
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
  }

  return (
    <div className="min-h-screen h-screen w-screen bg-gradient-to-br from-sky-50 to-sky-100 flex flex-col overflow-hidden">
      <div className="flex-1 flex items-center justify-center w-full h-full">
        <div className="w-full h-full bg-white p-6 md:p-8 flex flex-col">
          <div className="text-center mb-6 md:mb-8">
            <div className="animate-bounce">
              <TicketIcon className="h-16 w-16 text-sky-500 mx-auto mb-4" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-sky-800 mb-2">
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
                    className="flex flex-col items-center justify-center bg-white border-2 border-sky-200 hover:border-sky-500 hover:bg-sky-50 text-sky-800 font-bold py-12 px-6 rounded-xl transition-all duration-200 focus:ring-4 focus:ring-sky-300"
                  >
                    <span className="text-3xl mb-2">♿</span>
                    <span className="text-2xl">PWD</span>
                  </button>
                  <button
                    onClick={() => selectUserType(false)}
                    className="flex flex-col items-center justify-center bg-white border-2 border-sky-200 hover:border-sky-500 hover:bg-sky-50 text-sky-800 font-bold py-12 px-6 rounded-xl transition-all duration-200 focus:ring-4 focus:ring-sky-300"
                  >
                    <span className="text-3xl mb-2">👤</span>
                    <span className="text-2xl">REGULAR</span>
                  </button>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6 flex-1 flex flex-col">
                <div className="flex items-center mb-6">
                  <button
                    onClick={goBack}
                    className="flex items-center text-sky-600 hover:text-sky-800 transition-colors"
                  >
                    <ArrowLeftIcon className="h-5 w-5 mr-2" />
                    <span>Back</span>
                  </button>
                  <h2 className="text-2xl font-semibold text-sky-800 flex-grow text-center pr-10">
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
                      className="bg-white border border-sky-200 hover:border-sky-500 hover:bg-sky-50 rounded-xl p-6 text-left transition-all duration-200 focus:ring-4 focus:ring-sky-300"
                    >
                      <h3 className="text-xl font-bold text-sky-800 mb-2">
                        {service.name}
                      </h3>
                      <p className="text-sky-600">{service.description}</p>
                      <div className="mt-3 flex justify-end">
                        <span className="inline-flex items-center px-3 py-1 bg-sky-100 text-sky-800 rounded-full text-sm font-medium">
                          {isPWD ? `PWD-${service.code}` : service.code}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 3 && ticketData && (
              <div className="text-center space-y-6 animate-fade-in flex-1 flex flex-col justify-center">
                <div className="bg-sky-50 rounded-xl p-8 border border-sky-100">
                  <h2 className="text-lg font-semibold text-sky-600 mb-4">
                    YOUR TICKET NUMBER
                  </h2>
                  <div className="text-6xl font-bold text-sky-800 animate-pop-in mb-4">
                    {ticketData.ticketNumber}
                  </div>

                  <div className="mt-3 inline-flex items-center px-4 py-2 bg-sky-500 text-white rounded-full text-lg font-medium animate-fade-in">
                    {ticketData.isPrioritized
                      ? `PWD - ${ticketData.ticketNumber.slice(0, -1)}`
                      : ticketData.ticketNumber.slice(0, -1)}
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
                  className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-4 px-6 text-xl rounded-lg transition-colors duration-200 focus:ring-4 focus:ring-sky-300 focus:ring-offset-2"
                >
                  Get Another Ticket
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
