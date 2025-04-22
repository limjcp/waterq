"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

type Printer = {
  name: string;
  isDefault: boolean;
};

export default function PrinterSettings() {
  const { data: session, status: authStatus } = useSession(); // Renamed to authStatus
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState("");
  const [loading, setLoading] = useState(true);
  const [alertStatus, setAlertStatus] = useState(""); // Renamed to alertStatus

  useEffect(() => {
    async function fetchPrinters() {
      try {
        setLoading(true);
        // Get list of available printers
        const response = await fetch("http://localhost:3030/printers");
        if (response.ok) {
          const data = await response.json();
          setPrinters(data);
        }

        // Get current default printer
        const defaultResponse = await fetch(
          "http://localhost:3030/default-printer"
        );
        if (defaultResponse.ok) {
          const { printer } = await defaultResponse.json();
          setSelectedPrinter(printer);
        }
      } catch (error) {
        console.error("Error fetching printers:", error);
        setAlertStatus(
          "Failed to connect to print service. Make sure it's running."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchPrinters();
  }, []);

  const setDefaultPrinter = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:3030/default-printer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ printer: selectedPrinter }),
      });

      if (response.ok) {
        setAlertStatus("Default printer set successfully!");
        setTimeout(() => setAlertStatus(""), 3000);
      } else {
        setAlertStatus("Failed to set default printer");
      }
    } catch (error) {
      console.error("Error setting default printer:", error);
      setAlertStatus("Error connecting to print service");
    } finally {
      setLoading(false);
    }
  };

  if (authStatus === "unauthenticated") {
    // Changed to authStatus
    return <div>You must be signed in to access this page</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-sky-800 mb-6">Printer Settings</h1>

      {alertStatus && ( // Changed to alertStatus
        <div
          className={`p-4 mb-6 rounded-lg ${
            alertStatus.includes("Failed")
              ? "bg-red-50 text-red-700"
              : "bg-green-50 text-green-700"
          }`}
        >
          {alertStatus}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-2xl p-8">
        <h2 className="text-xl font-semibold text-sky-700 mb-4">
          Select Default Printer
        </h2>

        {loading ? (
          <div className="animate-spin h-8 w-8 border-4 border-sky-500 border-t-transparent rounded-full mx-auto"></div>
        ) : (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Printer
              </label>
              <select
                value={selectedPrinter}
                onChange={(e) => setSelectedPrinter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              >
                <option value="">System Default</option>
                {printers.map((printer, index) => (
                  <option key={index} value={printer.name}>
                    {printer.name} {printer.isDefault ? "(System Default)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={setDefaultPrinter}
              className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-lg transition-colors"
            >
              Save Settings
            </button>
          </>
        )}
      </div>
    </div>
  );
}
