"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

type Printer = {
  name: string;
  isDefault: boolean;
};

type PrintSettings = {
  printer: string;
  orientation: "portrait" | "landscape";
  paperSize: string;
  copies: number;
  scale: number;
  fit: boolean;
  customWidth: number; // Added for custom dimensions
  customHeight: number; // Added for custom dimensions
};

const PAPER_SIZES = [
  { value: "thermal", label: "Thermal Receipt (80mm × 51mm)" },
  { value: "a4", label: "A4" },
  { value: "letter", label: "Letter" },
  { value: "legal", label: "Legal" },
  { value: "custom", label: "Custom Size" }, // Added custom option
];

// Paper size dimensions in points (1/72 inch)
const PAPER_DIMENSIONS = {
  thermal: { width: 227, height: 145 }, // 80mm × 51mm
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
  legal: { width: 612, height: 1008 },
};

export default function PrinterSettings() {
  const { data: session, status: authStatus } = useSession();
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [settings, setSettings] = useState<PrintSettings>({
    printer: "",
    orientation: "portrait",
    paperSize: "thermal",
    copies: 1,
    scale: 100,
    fit: true,
    customWidth: 227, // Default to thermal width
    customHeight: 145, // Default to thermal height
  });
  const [loading, setLoading] = useState(true);
  const [alertStatus, setAlertStatus] = useState("");

  useEffect(() => {
    async function fetchPrinterData() {
      try {
        setLoading(true);

        // Get list of available printers
        const response = await fetch("http://localhost:3030/printers");
        if (response.ok) {
          const data = await response.json();
          setPrinters(data);
        }

        // Get current print settings
        const settingsResponse = await fetch(
          "http://localhost:3030/print-settings"
        );

        if (settingsResponse.ok) {
          const data = await settingsResponse.json();
          // Add default custom dimensions if they don't exist
          setSettings({
            ...data,
            customWidth: data.customWidth || 227,
            customHeight: data.customHeight || 145,
          });
        }
      } catch (error) {
        console.error("Error fetching printer data:", error);
        setAlertStatus(
          "Failed to connect to print service. Make sure it's running."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchPrinterData();
  }, []);

  const saveSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:3030/print-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setAlertStatus("Print settings saved successfully!");
        setTimeout(() => setAlertStatus(""), 3000);
      } else {
        setAlertStatus("Failed to save print settings");
      }
    } catch (error) {
      console.error("Error saving print settings:", error);
      setAlertStatus("Error connecting to print service");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof PrintSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  // When paper size changes, update custom dimensions to match if selecting a preset
  const handlePaperSizeChange = (value: string) => {
    if (
      value !== "custom" &&
      PAPER_DIMENSIONS[value as keyof typeof PAPER_DIMENSIONS]
    ) {
      const dimensions =
        PAPER_DIMENSIONS[value as keyof typeof PAPER_DIMENSIONS];
      setSettings((prev) => ({
        ...prev,
        paperSize: value,
        customWidth: dimensions.width,
        customHeight: dimensions.height,
      }));
    } else {
      setSettings((prev) => ({
        ...prev,
        paperSize: value,
      }));
    }
  };

  // Calculate preview dimensions
  const getPreviewDimensions = () => {
    let dimensions;

    // Use custom dimensions if custom paper size is selected
    if (settings.paperSize === "custom") {
      dimensions = {
        width: settings.customWidth,
        height: settings.customHeight,
      };
    } else {
      dimensions =
        PAPER_DIMENSIONS[settings.paperSize as keyof typeof PAPER_DIMENSIONS] ||
        PAPER_DIMENSIONS.thermal;
    }

    // Apply orientation
    const { width, height } = dimensions;
    const isLandscape = settings.orientation === "landscape";

    // Calculate scaled dimensions for preview (max 300px height)
    const maxPreviewHeight = 300;
    const scale = Math.min(
      maxPreviewHeight / (isLandscape ? width : height),
      1
    );

    return {
      width: (isLandscape ? height : width) * scale,
      height: (isLandscape ? width : height) * scale,
      aspectRatio: isLandscape
        ? `${height} / ${width}`
        : `${width} / ${height}`,
    };
  };

  const previewDimensions = getPreviewDimensions();

  // Convert points to more readable units for display
  const pointsToReadableUnits = (points: number) => {
    const inches = (points / 72).toFixed(2);
    const cm = (points / 28.35).toFixed(2);
    return `${points} pts (${inches}″ / ${cm} cm)`;
  };

  if (authStatus === "unauthenticated") {
    return <div>You must be signed in to access this page</div>;
  }

  return (
    <div className="max-w-5xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-sky-800 mb-6">Printer Settings</h1>

      {alertStatus && (
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-sky-700 mb-4">
            Print Format Settings
          </h2>

          {loading ? (
            <div className="animate-spin h-8 w-8 border-4 border-sky-500 border-t-transparent rounded-full mx-auto"></div>
          ) : (
            <>
              {/* Printer Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Printer
                </label>
                <select
                  value={settings.printer}
                  onChange={(e) => handleChange("printer", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                >
                  <option value="">System Default</option>
                  {printers.map((printer, index) => (
                    <option key={index} value={printer.name}>
                      {printer.name}{" "}
                      {printer.isDefault ? "(System Default)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Paper Size */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Paper Size
                </label>
                <select
                  value={settings.paperSize}
                  onChange={(e) => handlePaperSizeChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                >
                  {PAPER_SIZES.map((size) => (
                    <option key={size.value} value={size.value}>
                      {size.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Dimensions - only shown when paperSize is "custom" */}
              {settings.paperSize === "custom" && (
                <div className="mb-6 border-l-4 border-sky-100 pl-3 py-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Width (points)
                      </label>
                      <input
                        type="number"
                        min="72"
                        max="2000"
                        value={settings.customWidth}
                        onChange={(e) =>
                          handleChange("customWidth", parseInt(e.target.value))
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Height (points)
                      </label>
                      <input
                        type="number"
                        min="72"
                        max="2000"
                        value={settings.customHeight}
                        onChange={(e) =>
                          handleChange("customHeight", parseInt(e.target.value))
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                      />
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-gray-500">
                      Width: {pointsToReadableUnits(settings.customWidth)}
                      <br />
                      Height: {pointsToReadableUnits(settings.customHeight)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Note: 72 points = 1 inch, 28.35 points = 1 cm
                    </p>
                  </div>
                </div>
              )}

              {/* Orientation */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Orientation
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="orientation"
                      checked={settings.orientation === "portrait"}
                      onChange={() => handleChange("orientation", "portrait")}
                      className="mr-2"
                    />
                    Portrait
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="orientation"
                      checked={settings.orientation === "landscape"}
                      onChange={() => handleChange("orientation", "landscape")}
                      className="mr-2"
                    />
                    Landscape
                  </label>
                </div>
              </div>

              {/* Number of Copies */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Copies
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={settings.copies}
                  onChange={(e) =>
                    handleChange("copies", parseInt(e.target.value))
                  }
                  className="w-24 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                />
              </div>

              {/* Scale */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scale ({settings.scale}%)
                </label>
                <input
                  type="range"
                  min="50"
                  max="200"
                  step="5"
                  value={settings.scale}
                  onChange={(e) =>
                    handleChange("scale", parseInt(e.target.value))
                  }
                  className="w-full"
                />
              </div>

              {/* Fit to Page */}
              <div className="mb-6">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.fit}
                    onChange={(e) => handleChange("fit", e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Fit to page
                  </span>
                </label>
              </div>

              <button
                onClick={saveSettings}
                className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-lg transition-colors"
              >
                Save Settings
              </button>
            </>
          )}
        </div>

        {/* Ticket Preview */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-sky-700 mb-4">
            Ticket Preview
          </h2>

          <div className="flex flex-col items-center mt-4">
            <div className="bg-gray-100 p-6 rounded-lg mb-4 text-center">
              <div
                className="mx-auto bg-white border border-gray-300 shadow-md rounded-sm flex flex-col items-center justify-center overflow-hidden"
                style={{
                  width: `${previewDimensions.width}px`,
                  height: `${previewDimensions.height}px`,
                  aspectRatio: previewDimensions.aspectRatio,
                  transform: `scale(${settings.scale / 100})`,
                  transformOrigin: "center center",
                }}
              >
                <div className="p-4 flex flex-col items-center justify-center w-full h-full">
                  <div className="font-mono font-bold text-3xl mb-2">A-001</div>
                  <div className="font-mono text-sm">
                    {new Date().toLocaleString()}
                  </div>
                  <div className="font-mono text-xs mt-2">
                    Counter: Main Office
                  </div>
                </div>
              </div>
            </div>

            <div className="text-sm text-gray-500 mt-2">
              <p className="font-medium">
                Paper size:{" "}
                {settings.paperSize === "custom"
                  ? `Custom (${settings.customWidth}×${settings.customHeight} pts)`
                  : PAPER_SIZES.find((p) => p.value === settings.paperSize)
                      ?.label}
              </p>
              <p className="font-medium">Orientation: {settings.orientation}</p>
              <p className="font-medium">Scale: {settings.scale}%</p>
            </div>

            <div className="text-xs text-gray-500 mt-4 text-center">
              <p>
                This is a preview and may differ slightly from actual print
                output.
              </p>
              <p>
                The preview shows how content will be positioned on the paper.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
