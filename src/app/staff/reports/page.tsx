"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import Button from "@/components/Button";
import { useRouter } from "next/navigation";
import Image from "next/image";

// Format time (seconds) as MM:SS
const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.round(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  } else {
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }
};

// Helper function to get user initials
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    // Get first letter of first name and first letter of last name
    return (
      parts[0][0] + parts[parts.length - 1][0]
    ).toUpperCase();
  } else if (parts.length === 1 && parts[0]) {
    // If only one name, get first letter
    return parts[0][0].toUpperCase();
  }
  return "U"; // Default if no name is available
}

// Types
type TicketDetail = {
  ticketNumber: number;
  prefix: string;
  serviceName: string;
  serviceTypeName: string;
  dateTime: string;
  serviceTime: number;
  remarks?: string;
  status: string;
  servingStart: string;
  servingEnd?: string;
  serviceTypeId?: string;
};

type ServiceType = {
  id: string;
  name: string;
  code: string;
  serviceId: string;
  serviceName: string;
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
    serviceId: string;
    types: {
      typeName: string;
      typeId: string;
      count: number;
    }[];
  }[];
  ticketDetails: TicketDetail[];
};

export default function StaffReports() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] =
    useState<string>(
      format(
        new Date(
          Date.now() - 7 * 24 * 60 * 60 * 1000
        ),
        "yyyy-MM-dd"
      )
    );
  const [endDate, setEndDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  const [reportData, setReportData] =
    useState<ReportData | null>(null);
  const [isGenerating, setIsGenerating] =
    useState(false);
  const [serviceTypes, setServiceTypes] =
    useState<ServiceType[]>([]);
  const [
    selectedServiceTypeId,
    setSelectedServiceTypeId,
  ] = useState<string>("");

  // Add new state for profile menu
  const [
    isProfileMenuOpen,
    setIsProfileMenuOpen,
  ] = useState(false);

  // Add new state for PDF preview
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Add click handler for sign out
  const handleSignOut = () => {
    window.location.href = "/api/auth/signout";
  };

  // Add pagination for tickets display
  const [currentPage, setCurrentPage] =
    useState(1);
  const ticketsPerPage = 20; // Limit number of tickets shown per page
  // Pagination calculations
  const indexOfLastTicket =
    currentPage * ticketsPerPage;
  const indexOfFirstTicket =
    indexOfLastTicket - ticketsPerPage;

  // Filter tickets by selected service type if needed
  const filteredTickets =
    reportData?.ticketDetails
      ? selectedServiceTypeId
        ? reportData.ticketDetails.filter(
            (ticket) =>
              ticket.serviceTypeId ===
              selectedServiceTypeId
          )
        : reportData.ticketDetails
      : [];

  const currentTickets = filteredTickets.slice(
    indexOfFirstTicket,
    indexOfLastTicket
  );

  const totalPages =
    filteredTickets.length > 0
      ? Math.ceil(
          filteredTickets.length / ticketsPerPage
        )
      : 0; // Fetch service types based on user's assigned counter service
  const fetchServiceTypes = async () => {
    try {
      // Use the new endpoint that filters service types by the user's service assignment
      const res = await fetch(
        "/api/servicetypes/user"
      );
      if (res.ok) {
        const types = await res.json();
        setServiceTypes(types);
      }
    } catch (error) {
      console.error(
        "Error fetching service types:",
        error
      );
    }
  };
  // Auth redirect and initial data loading
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated") {
      setLoading(false);
      fetchServiceTypes();
      // No longer auto-generating report on component mount
    }
  }, [
    status,
    router,
    session
  ]);

  // Generate report function
  const generateReport = async () => {
    if (!session?.user?.username) return;

    setIsGenerating(true);
    try {
      let endpoint = `/api/reports/staff?username=${session.user.username}&startDate=${startDate}&endDate=${endDate}`;

      // Add service type filter if selected
      if (selectedServiceTypeId) {
        endpoint += `&serviceTypeId=${selectedServiceTypeId}`;
      }

      const res = await fetch(endpoint);

      if (res.ok) {
        const data = await res.json();
        setReportData(data);
        setCurrentPage(1); // Reset to first page

        // Automatically generate PDF preview after report data is loaded
        generatePdfPreview(data);
      } else {
        console.error(
          "Failed to generate report"
        );
      }
    } catch (error) {
      console.error(
        "Error generating report:",
        error
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Update the PDF preview generation to accept report data parameter
  const generatePdfPreview = async (reportDataToUse = null) => {
    const dataToUse = reportDataToUse || reportData;
    if (!session?.user?.username || !dataToUse) return;

    setIsGeneratingPdf(true);
    try {
      // Use the existing PDF generation endpoint
      const res = await fetch("/api/reports/pdf", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reportData: dataToUse,
          startDate,
          endDate,
          reportMode: "staff"
        })
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        setPdfPreviewUrl(url);
        setIsPdfPreviewOpen(true);
      } else {
        console.error("Failed to generate PDF preview");
        alert("Failed to generate PDF preview. Please try again.");
      }
    } catch (error) {
      console.error("Error generating PDF preview:", error);
      alert("An error occurred while generating the PDF preview.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Close PDF preview and clean up the object URL
  const closePdfPreview = () => {
    if (pdfPreviewUrl) {
      URL.revokeObjectURL(pdfPreviewUrl);
      setPdfPreviewUrl(null);
    }
    setIsPdfPreviewOpen(false);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "MMM d, yyyy h:mm a");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-sky-100 p-8 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-sky-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-sky-100">
      {/* Full-width header that stretches edge to edge */}
      <div className="bg-sky-800 shadow-lg p-0 mb-8 w-full sticky top-0 z-10">
        <div className="w-full flex justify-between items-center px-8">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <Image
              src="/wdlogo.png"
              alt="WD Logo"
              width={120}
              height={120}
            />

            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                My Service Reports
              </h1>
            </div>
          </div>

          {/* User Profile */}
          {session?.user && (
            <div className="flex items-center relative">
              <button
                onClick={() =>
                  setIsProfileMenuOpen(
                    !isProfileMenuOpen
                  )
                }
                className="flex items-center cursor-pointer hover:bg-sky-700 px-3 py-1 rounded-full transition-colors"
              >
                <div className="bg-white text-sky-600 rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg mr-3 shadow-sm">
                  {getInitials(
                    session.user.name || ""
                  )}
                </div>
                <span className="text-white font-medium">
                  {session.user.name ||
                    "Staff User"}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-4 w-4 ml-2 text-white transition-transform ${
                    isProfileMenuOpen
                      ? "rotate-180"
                      : ""
                  }`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>

              {/* Profile Menu Dropdown */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 top-14 w-72 bg-white rounded-lg shadow-xl border border-gray-100 py-3 z-50 animate-fadeIn">
                  <h3 className="font-semibold text-sky-800 px-4 mb-1">
                    Quick Links
                  </h3>
                  <div className="px-2 py-1">
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() =>
                        router.push(
                          "/staff/counters"
                        )
                      }
                      className="w-full text-left px-4 py-2 transition-colors flex items-center gap-2"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                      </svg>
                      Back to Dashboard
                    </Button>
                  </div>
                  <div className="px-2 py-1">
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 transition-colors flex items-center gap-2"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3 3a1 1 0 011-1h12a1 1 0 011 1v16a1 1 0 01-1 1H4a1 1 0 01-1-1V3zm10 12a1 1 0 01-1 1H8a1 1 0 110-2h4a1 1 0 011 1zm0-4a1 1 0 01-1 1H8a1 1 0 110-2h4a1 1 0 011 1zm0-4a1 1 0 01-1 1H8a1 1 0 010-2h4a1 1 0 011 1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Sign Out
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>{" "}
      {/* Main Content */}
      <div className="w-full px-8 py-6">
        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-bold text-sky-800 mb-4">
            Filter Options
          </h2>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label
                htmlFor="startDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Start Date
              </label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) =>
                  setStartDate(e.target.value)
                }
                className="border border-gray-300 rounded-md p-2"
                aria-label="Start Date"
                title="Start Date for report"
              />
            </div>
            <div>
              <label
                htmlFor="endDate"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                End Date
              </label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) =>
                  setEndDate(e.target.value)
                }
                className="border border-gray-300 rounded-md p-2"
                aria-label="End Date"
                title="End Date for report"
              />
            </div>
            {/* Service Type Filter */}
            <div>
              <label
                htmlFor="serviceTypeFilter"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Service Type
              </label>
              <div className="flex items-center gap-2">
                {" "}
                <select
                  id="serviceTypeFilter"
                  value={selectedServiceTypeId}
                  onChange={(e) =>
                    setSelectedServiceTypeId(
                      e.target.value
                    )
                  }
                  className="border border-gray-300 rounded-md p-2 min-w-[220px]"
                  aria-label="Filter by Service Type"
                  title="Select a service type to filter the report"
                >
                  <option value="">
                    All Service Types
                  </option>
                  {/* Group service types by service */}
                  {Object.entries(
                    serviceTypes.reduce(
                      (acc, type) => {
                        // Group by service
                        const serviceName =
                          type.serviceName;
                        if (!acc[serviceName]) {
                          acc[serviceName] = [];
                        }
                        acc[serviceName].push(
                          type
                        );
                        return acc;
                      },
                      {} as Record<
                        string,
                        ServiceType[]
                      >
                    )
                  ).map(
                    ([serviceName, types]) => (
                      <optgroup
                        key={serviceName}
                        label={serviceName}
                      >
                        {types.map((type) => (
                          <option
                            key={type.id}
                            value={type.id}
                          >
                            {type.name} (
                            {type.code})
                          </option>
                        ))}
                      </optgroup>
                    )
                  )}
                </select>
                {selectedServiceTypeId && (
                  <button
                    onClick={() =>
                      setSelectedServiceTypeId("")
                    }
                    className="bg-gray-200 hover:bg-gray-300 rounded-md p-2 text-gray-700 transition-colors"
                    title="Clear service type filter"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={generateReport}
              disabled={isGenerating}
              className="ml-2"
              aria-label="Generate Report"
              title="Generate Report with selected filters"
            >
              {isGenerating ? (
                <>
                  <span className="animate-spin inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                  Generating...
                </>
              ) : (
                "Generate Report"
              )}
            </Button>
          </div>
        </div>
        {/* Report Results */}
        {reportData && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-sky-800">
                Report for {reportData.name}
              </h2>

              {/* PDF Preview Button */}
              {/* <Button
                variant="secondary"
                size="md"
                onClick={generatePdfPreview}
                disabled={isGeneratingPdf}
                className="flex items-center gap-2"
                aria-label="Preview PDF Report"
                title="Generate a PDF preview of this report"
              >
                {isGeneratingPdf ? (
                  <>
                    <span className="animate-spin inline-block h-4 w-4 border-2 border-sky-500 border-t-transparent rounded-full"></span>
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                    Preview PDF Report
                  </>
                )}
              </Button> */}
            </div>

            {/* Summary Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-sky-50 p-4 rounded-lg border border-sky-100">
                <h3 className="text-lg font-semibold text-sky-700 mb-1">
                  Total Tickets Served
                </h3>
                <p className="text-3xl font-bold text-sky-800">
                  {reportData.ticketsServed}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <h3 className="text-lg font-semibold text-green-700 mb-1">
                  Average Service Time (MM:SS)
                </h3>
                <p className="text-3xl font-bold text-green-800">
                  {formatTime(
                    reportData.averageServiceTime
                  )}
                </p>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                <h3 className="text-lg font-semibold text-amber-700 mb-1">
                  Service Types Handled
                </h3>
                <p className="text-3xl font-bold text-amber-800">
                  {reportData.serviceTypesBreakdown.reduce(
                    (sum, service) =>
                      sum + service.types.length,
                    0
                  )}
                </p>
              </div>
            </div>
            {/* Service By Day */}
            <h3 className="text-xl font-bold text-sky-800 mb-4">
              Service By Day
            </h3>
            <div className="overflow-x-auto mb-8">
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
                  {reportData.serviceByDay.map(
                    (day, index) => (
                      <tr
                        key={index}
                        className="border-b border-sky-50"
                      >
                        <td className="py-3 px-4">
                          {day.date}
                        </td>
                        <td className="py-3 px-4">
                          {day.count}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
            {/* Service Type Breakdown */}
            <h3 className="text-xl font-bold text-sky-800 mb-4">
              Service Type Breakdown
            </h3>
            {reportData.serviceTypesBreakdown.map(
              (service, serviceIndex) => (
                <div
                  key={serviceIndex}
                  className="mb-8"
                >
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
                        {service.types.map(
                          (type, typeIndex) => (
                            <tr
                              key={typeIndex}
                              className="border-b border-sky-50"
                            >
                              <td className="py-3 px-4">
                                {type.typeName}
                              </td>
                              <td className="py-3 px-4">
                                {type.count}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            )}{" "}
            {/* Detailed ticket information section with pagination */}
            {reportData.ticketDetails &&
              reportData.ticketDetails.length >
                0 && (
                <div className="mt-10">
                  <h3 className="text-xl font-bold text-sky-800 mb-4">
                    Detailed Ticket Information
                    <span className="text-sm font-normal ml-2 text-sky-600">
                      (Showing{" "}
                      {filteredTickets.length > 0
                        ? `${
                            indexOfFirstTicket + 1
                          }-${Math.min(
                            indexOfLastTicket,
                            filteredTickets.length
                          )}`
                        : "0"}{" "}
                      of {filteredTickets.length}
                      {selectedServiceTypeId &&
                        ` filtered from ${reportData.ticketDetails.length} total tickets`}
                      )
                    </span>
                    {selectedServiceTypeId &&
                      serviceTypes.length > 0 && (
                        <span className="ml-2 bg-sky-100 text-sky-800 text-xs px-2 py-1 rounded-full">
                          Filtered by:{" "}
                          {serviceTypes.find(
                            (t) =>
                              t.id ===
                              selectedServiceTypeId
                          )?.name ||
                            "Unknown service type"}
                        </span>
                      )}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border border-sky-100">
                      <thead>
                        <tr className="bg-sky-50">
                          <th className="py-3 px-4 text-left font-medium text-sky-700 border-b">
                            Ticket Number
                          </th>
                          <th className="py-3 px-4 text-left font-medium text-sky-700 border-b">
                            Service
                          </th>
                          <th className="py-3 px-4 text-left font-medium text-sky-700 border-b">
                            Service Type
                          </th>
                          <th className="py-3 px-4 text-left font-medium text-sky-700 border-b">
                            Start Time
                          </th>
                          <th className="py-3 px-4 text-left font-medium text-sky-700 border-b">
                            End Time
                          </th>
                          <th className="py-3 px-4 text-left font-medium text-sky-700 border-b">
                            Service Time (MM:SS)
                          </th>
                          <th className="py-3 px-4 text-left font-medium text-sky-700 border-b">
                            Remarks
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {currentTickets.map(
                          (ticket, index) => (
                            <tr
                              key={index}
                              className="border-b border-sky-50"
                            >
                              <td className="py-3 px-4">
                                {ticket.prefix}-
                                {String(
                                  ticket.ticketNumber
                                ).padStart(
                                  3,
                                  "0"
                                )}
                              </td>
                              <td className="py-3 px-4">
                                {
                                  ticket.serviceName
                                }
                              </td>{" "}
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-1">
                                  {
                                    ticket.serviceTypeName
                                  }
                                  {!selectedServiceTypeId && (
                                    <button
                                      onClick={() =>
                                        setSelectedServiceTypeId(
                                          ticket.serviceTypeId
                                        )
                                      }
                                      title="Filter by this service type"
                                      className="ml-2 text-sky-600 hover:text-sky-800 focus:outline-none"
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-4 w-4"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                    </button>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4">
                                {formatDate(
                                  ticket.servingStart
                                )}
                              </td>
                              <td className="py-3 px-4">
                                {ticket.servingEnd
                                  ? formatDate(
                                      ticket.servingEnd
                                    )
                                  : "-"}
                              </td>
                              <td className="py-3 px-4">
                                {formatTime(
                                  ticket.serviceTime
                                )}
                              </td>
                              <td className="py-3 px-4 max-w-xs truncate">
                                {ticket.remarks ||
                                  "-"}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex justify-center mt-6">
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            setCurrentPage(
                              Math.max(
                                1,
                                currentPage - 1
                              )
                            )
                          }
                          disabled={
                            currentPage === 1
                          }
                        >
                          Previous
                        </Button>
                        <div className="flex items-center bg-white px-3 py-1 rounded-md border border-gray-300">
                          Page {currentPage} of{" "}
                          {totalPages}
                        </div>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            setCurrentPage(
                              Math.min(
                                totalPages,
                                currentPage + 1
                              )
                            )
                          }
                          disabled={
                            currentPage ===
                            totalPages
                          }
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
          </div>
        )}
      </div>

      {/* PDF Preview Modal */}
      {isPdfPreviewOpen && pdfPreviewUrl && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-sky-800 rounded-lg shadow-xl w-full h-full flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-white">PDF Report Preview</h3>
              <div className="flex gap-3">

                <Button
                variant="danger"
                  onClick={closePdfPreview}
                  className=" py-2 px-4 rounded-md flex items-center gap-2 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Close
                </Button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                src={pdfPreviewUrl}
                className="w-full h-full"
                title="PDF Report Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
