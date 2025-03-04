"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";

// Types
type StaffMember = {
  id: string;
  username: string;
  name: string;
};

type ReportData = {
  username: string;
  name: string;
  ticketsServed: number;
  averageServiceTime: number;
  serviceByDay: {
    date: string;
    count: number;
  }[];
  serviceByType: {
    serviceName: string;
    count: number;
  }[];
};

export default function StaffReports() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string>("");
  const [startDate, setStartDate] = useState<string>(
    format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch staff members on mount
  useEffect(() => {
    async function fetchStaffMembers() {
      if (status === "authenticated") {
        try {
          const res = await fetch("/api/user/list?role=STAFF");
          if (res.ok) {
            const data = await res.json();
            setStaffMembers(data);
          }
        } catch (error) {
          console.error("Error fetching staff members:", error);
        } finally {
          setLoading(false);
        }
      } else if (status === "unauthenticated") {
        setLoading(false);
      }
    }

    fetchStaffMembers();
  }, [status]);

  // Format time (seconds) as MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Generate report
  const generateReport = async () => {
    if (!selectedStaff) return;

    setIsGenerating(true);
    try {
      const res = await fetch(
        `/api/reports/staff?username=${selectedStaff}&startDate=${startDate}&endDate=${endDate}`
      );

      if (res.ok) {
        const data = await res.json();
        setReportData(data);
      } else {
        console.error("Failed to generate report");
      }
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Export report as CSV
  const exportReport = () => {
    if (!reportData) return;

    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";

    // Add header
    csvContent += "Staff Report for " + reportData.name + "\r\n";
    csvContent += "Period: " + startDate + " to " + endDate + "\r\n\r\n";

    // Add summary
    csvContent += "Total Tickets Served," + reportData.ticketsServed + "\r\n";
    csvContent +=
      "Average Service Time," +
      formatTime(reportData.averageServiceTime) +
      "\r\n\r\n";

    // Add daily breakdown
    csvContent += "Daily Breakdown\r\n";
    csvContent += "Date,Tickets Served\r\n";
    reportData.serviceByDay.forEach((day) => {
      csvContent += `${day.date},${day.count}\r\n`;
    });

    csvContent += "\r\nService Type Breakdown\r\n";
    csvContent += "Service,Tickets Served\r\n";
    reportData.serviceByType.forEach((service) => {
      csvContent += `${service.serviceName},${service.count}\r\n`;
    });

    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `staff_report_${reportData.username}_${startDate}_${endDate}.csv`
    );
    document.body.appendChild(link);

    // Trigger download and clean up
    link.click();
    document.body.removeChild(link);
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-sky-100 p-8 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-sky-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-sky-100 p-8">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl p-8 text-center">
          <h1 className="text-3xl font-bold text-sky-800 mb-6">
            Staff Reports
          </h1>
          <p className="text-xl text-red-500">
            Please log in to access the reports.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-sky-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
          <h1 className="text-3xl font-bold text-sky-800 mb-6">
            Staff Performance Reports
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Staff Selection */}
            <div>
              <label className="block text-sm font-medium text-sky-700 mb-2">
                Select Staff Member
              </label>
              <select
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                className="w-full px-4 py-2 border border-sky-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="">Select a staff member...</option>
                {staffMembers.map((staff) => (
                  <option key={staff.id} value={staff.username}>
                    {staff.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-sky-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-sky-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-sky-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-sky-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={generateReport}
              disabled={!selectedStaff || isGenerating}
              className={`px-8 py-3 rounded-lg transition-colors text-white font-medium ${
                !selectedStaff || isGenerating
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-sky-500 hover:bg-sky-600"
              }`}
            >
              {isGenerating ? (
                <span className="flex items-center">
                  <span className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Generating...
                </span>
              ) : (
                "Generate Report"
              )}
            </button>
          </div>
        </div>

        {reportData && (
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-sky-800">
                Report for {reportData.name}
              </h2>
              <button
                onClick={exportReport}
                className="bg-green-500 hover:bg-green-600 text-white font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Export CSV
              </button>
            </div>

            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-sky-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-sky-700 mb-3">
                  Total Tickets Served
                </h3>
                <p className="text-3xl font-bold text-sky-800">
                  {reportData.ticketsServed}
                </p>
              </div>

              <div className="bg-sky-50 rounded-lg p-6">
                <h3 className="text-lg font-medium text-sky-700 mb-3">
                  Average Service Time
                </h3>
                <p className="text-3xl font-bold text-sky-800">
                  {formatTime(reportData.averageServiceTime)}
                </p>
              </div>
            </div>

            {/* Daily Breakdown */}
            <h3 className="text-xl font-bold text-sky-800 mb-4">
              Daily Breakdown
            </h3>
            <div className="mb-8 overflow-x-auto">
              <table className="min-w-full bg-white border border-sky-100">
                <thead>
                  <tr className="bg-sky-50">
                    <th className="py-3 px-4 text-left font-medium text-sky-700 border-b">
                      Date
                    </th>
                    <th className="py-3 px-4 text-left font-medium text-sky-700 border-b">
                      Tickets Served
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.serviceByDay.map((day, index) => (
                    <tr key={index} className="border-b border-sky-50">
                      <td className="py-3 px-4">{day.date}</td>
                      <td className="py-3 px-4">{day.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Service Type Breakdown */}
            <h3 className="text-xl font-bold text-sky-800 mb-4">
              Service Type Breakdown
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-sky-100">
                <thead>
                  <tr className="bg-sky-50">
                    <th className="py-3 px-4 text-left font-medium text-sky-700 border-b">
                      Service Type
                    </th>
                    <th className="py-3 px-4 text-left font-medium text-sky-700 border-b">
                      Tickets Served
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.serviceByType.map((service, index) => (
                    <tr key={index} className="border-b border-sky-50">
                      <td className="py-3 px-4">{service.serviceName}</td>
                      <td className="py-3 px-4">{service.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
