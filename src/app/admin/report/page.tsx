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

type Service = {
  id: string;
  code: string;
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
  serviceTypesBreakdown: {
    serviceName: string;
    types: {
      typeName: string;
      count: number;
    }[];
  }[];
};

// Add new type for report mode
type ReportMode = "staff" | "service";

export default function StaffReports() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [reportMode, setReportMode] = useState<ReportMode>("staff");
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string>("");
  const [selectedService, setSelectedService] = useState<string>("");
  const [startDate, setStartDate] = useState<string>(
    format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Update useEffect to fetch both staff and services
  useEffect(() => {
    async function fetchData() {
      if (status === "authenticated") {
        try {
          const [staffRes, servicesRes] = await Promise.all([
            fetch("/api/user/list?role=STAFF"),
            fetch("/api/service/list"),
          ]);

          if (staffRes.ok) {
            const staffData = await staffRes.json();
            setStaffMembers(staffData);
          }

          if (servicesRes.ok) {
            const servicesData = await servicesRes.json();
            setServices(servicesData);
          }
        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          setLoading(false);
        }
      } else if (status === "unauthenticated") {
        setLoading(false);
      }
    }

    fetchData();
  }, [status]);

  // Format time (seconds) as MM:SS
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Update generate report function
  const generateReport = async () => {
    if (
      (reportMode === "staff" && !selectedStaff) ||
      (reportMode === "service" && !selectedService)
    )
      return;

    setIsGenerating(true);
    try {
      const endpoint =
        reportMode === "staff"
          ? `/api/reports/staff?username=${selectedStaff}&startDate=${startDate}&endDate=${endDate}`
          : `/api/reports/service?serviceId=${selectedService}&startDate=${startDate}&endDate=${endDate}`;

      const res = await fetch(endpoint);

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

    // Add service type breakdown
    csvContent += "\r\nDetailed Service Type Breakdown\r\n";
    reportData.serviceTypesBreakdown.forEach((service) => {
      csvContent += `\r\n${service.serviceName}\r\n`;
      csvContent += "Service Type,Tickets Served\r\n";
      service.types.forEach((type) => {
        csvContent += `${type.typeName},${type.count}\r\n`;
      });
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
            Performance Reports
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* Report Type Selection */}
            <div>
              <label className="block text-sm font-medium text-sky-700 mb-2">
                Report Type
              </label>
              <select
                value={reportMode}
                onChange={(e) => {
                  setReportMode(e.target.value as ReportMode);
                  setSelectedStaff("");
                  setSelectedService("");
                  setReportData(null);
                }}
                className="w-full px-4 py-2 border border-sky-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="staff">Staff Report</option>
                <option value="service">Service Report</option>
              </select>
            </div>

            {/* Staff/Service Selection */}
            <div>
              <label className="block text-sm font-medium text-sky-700 mb-2">
                {reportMode === "staff"
                  ? "Select Staff Member"
                  : "Select Service"}
              </label>
              <select
                value={reportMode === "staff" ? selectedStaff : selectedService}
                onChange={(e) =>
                  reportMode === "staff"
                    ? setSelectedStaff(e.target.value)
                    : setSelectedService(e.target.value)
                }
                className="w-full px-4 py-2 border border-sky-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="">Select...</option>
                {reportMode === "staff"
                  ? staffMembers.map((staff) => (
                      <option key={staff.id} value={staff.username}>
                        {staff.name}
                      </option>
                    ))
                  : services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name}
                      </option>
                    ))}
              </select>
            </div>

            {/* Existing date inputs */}
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
              disabled={
                (reportMode === "staff" ? !selectedStaff : !selectedService) ||
                isGenerating
              }
              className={`px-8 py-3 rounded-lg transition-colors text-white font-medium ${
                (reportMode === "staff" ? !selectedStaff : !selectedService) ||
                isGenerating
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

            {/* Service Type Detailed Breakdown */}
            <h3 className="text-xl font-bold text-sky-800 mb-4">
              Service Type Breakdown
            </h3>
            {reportData.serviceTypesBreakdown.map((service, serviceIndex) => (
              <div key={serviceIndex} className="mb-8">
                <h4 className="text-lg font-semibold text-sky-700 mb-3">
                  {service.serviceName}
                </h4>
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
                      {service.types.map((type, typeIndex) => (
                        <tr key={typeIndex} className="border-b border-sky-50">
                          <td className="py-3 px-4">{type.typeName}</td>
                          <td className="py-3 px-4">{type.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
