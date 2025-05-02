"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import Button from "@/components/Button";

// Format time (seconds) as MM:SS
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(
    seconds % 60
  );
  return `${minutes}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;
};

// Types
type ServiceReport = {
  serviceName: string;
  ticketsServed: number;
  averageServiceTime: number;
  serviceByDay: {
    date: string;
    count: number;
  }[];
  serviceTypesBreakdown: {
    serviceName: string;
    types: {
      typeName: string;
      count: number;
    }[];
  }[];
  ticketDetails: TicketDetail[];
};

type TicketDetail = {
  ticketNumber: string;
  prefix: string;
  serviceName: string;
  serviceTypeName: string;
  dateTime: string;
  serviceTime: number;
  staffName?: string;
  remarks?: string; // Add this line
};

// New types for filters
type User = {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
};

type ServiceType = {
  id: string;
  name: string;
  code: string;
};

export default function SupervisorReports() {
  const { data: session, status } = useSession();

  const [loading, setLoading] = useState(true);
  const [serviceName, setServiceName] =
    useState("");
  const [serviceId, setServiceId] = useState("");
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
    useState<ServiceReport | null>(null);
  const [isGenerating, setIsGenerating] =
    useState(false);
  const [isLoadingPdf, setIsLoadingPdf] =
    useState(false);
  const [showPdfPreview, setShowPdfPreview] =
    useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] =
    useState<string | null>(null);
  const [currentPage, setCurrentPage] =
    useState(1);
  const ticketsPerPage = 50;
  const [error, setError] = useState("");

  // New state for filter data
  const [users, setUsers] = useState<User[]>([]);
  const [serviceTypes, setServiceTypes] =
    useState<ServiceType[]>([]);
  const [selectedUserId, setSelectedUserId] =
    useState<string>("all");
  const [
    selectedServiceTypeId,
    setSelectedServiceTypeId,
  ] = useState<string>("all");
  const [loadingFilters, setLoadingFilters] =
    useState(false);

  // Calculate pagination metrics
  const indexOfLastTicket =
    currentPage * ticketsPerPage;
  const indexOfFirstTicket =
    indexOfLastTicket - ticketsPerPage;
  const currentTickets = reportData?.ticketDetails
    ? reportData.ticketDetails.slice(
        indexOfFirstTicket,
        indexOfLastTicket
      )
    : [];

  useEffect(() => {
    if (
      status === "authenticated" &&
      session?.user
    ) {
      // Extract supervisedService directly from session if available
      if (session.user.supervisedService) {
        const serviceData =
          session.user.supervisedService;
        setServiceId(serviceData.id);
        setServiceName(serviceData.name);

        // Fetch filter data
        fetchFilterData(serviceData.id);
      } else {
        // Fall back to API call if not available in session
        fetchSupervisedService().then(
          (serviceData) => {
            if (serviceData) {
              setServiceId(serviceData.id);
              setServiceName(serviceData.name);

              // Fetch filter data
              fetchFilterData(serviceData.id);
            } else {
              setLoading(false);
            }
          }
        );
      }
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, session]);

  const fetchSupervisedService = async () => {
    try {
      const response = await fetch(
        `/api/supervisor/service`
      );
      if (!response.ok)
        throw new Error(
          "Failed to fetch supervised service"
        );
      return await response.json();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch supervised service"
      );
      return null;
    }
  };

  // New function to fetch filter data (users and service types)
  const fetchFilterData = async (
    serviceId: string
  ) => {
    setLoadingFilters(true);
    try {
      // Fetch users assigned to this service's counters
      const usersResponse = await fetch(
        `/api/supervisor/users?serviceId=${serviceId}`
      );
      if (!usersResponse.ok)
        throw new Error("Failed to fetch users");
      const usersData =
        await usersResponse.json();
      setUsers(usersData);

      // Fetch service types for this service
      const serviceTypesResponse = await fetch(
        `/api/supervisor/service-types?serviceId=${serviceId}`
      );
      if (!serviceTypesResponse.ok)
        throw new Error(
          "Failed to fetch service types"
        );
      const serviceTypesData =
        await serviceTypesResponse.json();
      setServiceTypes(serviceTypesData);
    } catch (err) {
      console.error(
        "Error fetching filter data:",
        err
      );
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch filter data"
      );
    } finally {
      setLoadingFilters(false);
      setLoading(false);
    }
  };

  // Cleanup effect for PDF preview URL
  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl);
      }
    };
  }, [pdfPreviewUrl]);

  const generateReport = async () => {
    if (!serviceId || !startDate || !endDate) {
      setError(
        "Please select all required fields"
      );
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      // Build URL with filters
      let url = `/api/reports/supervisor/service?serviceId=${serviceId}&startDate=${startDate}&endDate=${endDate}`;

      // Add user filter if not "all"
      if (selectedUserId !== "all") {
        url += `&userId=${selectedUserId}`;
      }

      // Add service type filter if not "all"
      if (selectedServiceTypeId !== "all") {
        url += `&serviceTypeId=${selectedServiceTypeId}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            "Failed to generate report"
        );
      }

      const data = await response.json();
      setReportData(data);
      setCurrentPage(1);
    } catch (error) {
      console.error(
        "Error generating report:",
        error
      );
      setError(
        error instanceof Error
          ? error.message
          : "An error occurred"
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePdfGeneration = async () => {
    if (!serviceId || !startDate || !endDate) {
      setError(
        "Please select all required fields"
      );
      return;
    }

    setIsLoadingPdf(true);

    try {
      const response = await fetch(
        "/api/reports/supervisor/pdf",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reportType: "service",
            serviceId,
            startDate,
            endDate,
            userId:
              selectedUserId !== "all"
                ? selectedUserId
                : undefined,
            serviceTypeId:
              selectedServiceTypeId !== "all"
                ? selectedServiceTypeId
                : undefined,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            "Failed to generate PDF"
        );
      }

      const blob = await response.blob();
      const pdfUrl = URL.createObjectURL(blob);
      setPdfPreviewUrl(pdfUrl);
      setShowPdfPreview(true);
    } catch (error) {
      console.error(
        "Error generating PDF:",
        error
      );
      setError(
        error instanceof Error
          ? error.message
          : "Failed to generate PDF"
      );
    } finally {
      setIsLoadingPdf(false);
    }
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
            Service Reports
          </h1>
          <p className="text-xl text-red-500">
            Please log in to access the reports.
          </p>
        </div>
      </div>
    );
  }

  if (!serviceId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-sky-100 p-8">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl p-8 text-center">
          <h1 className="text-3xl font-bold text-sky-800 mb-6">
            Service Reports
          </h1>
          <p className="text-xl text-red-500">
            No service selected. Please return to
            the dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-sky-50 to-sky-100">
      <div className="max-w-10xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
          <h1 className="text-3xl font-bold text-sky-800 mb-6">
            {serviceName} - Service Reports
          </h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <div className="bg-sky-50 rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-sky-700 mb-4">
              Report Filters
            </h2>

            {/* Date Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-sky-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) =>
                    setStartDate(e.target.value)
                  }
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
                  onChange={(e) =>
                    setEndDate(e.target.value)
                  }
                  className="w-full px-4 py-2 border border-sky-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* Staff and Service Type Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Staff Filter */}
              <div>
                <label className="block text-sm font-medium text-sky-700 mb-2">
                  Filter by Staff
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) =>
                    setSelectedUserId(
                      e.target.value
                    )
                  }
                  disabled={loadingFilters}
                  className="w-full px-4 py-2 border border-sky-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="all">
                    All Staff Members
                  </option>
                  {users.map((user) => (
                    <option
                      key={user.id}
                      value={user.id}
                    >
                      {user.firstName}{" "}
                      {user.lastName} (
                      {user.username})
                    </option>
                  ))}
                </select>
              </div>

              {/* Service Type Filter */}
              <div>
                <label className="block text-sm font-medium text-sky-700 mb-2">
                  Filter by Service Type
                </label>
                <select
                  value={selectedServiceTypeId}
                  onChange={(e) =>
                    setSelectedServiceTypeId(
                      e.target.value
                    )
                  }
                  disabled={loadingFilters}
                  className="w-full px-4 py-2 border border-sky-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="all">
                    All Service Types
                  </option>
                  {serviceTypes.map((type) => (
                    <option
                      key={type.id}
                      value={type.id}
                    >
                      {type.name} ({type.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Generate buttons */}
            <div className="flex flex-wrap gap-4">
              <Button
                onClick={generateReport}
                disabled={isGenerating}
                variant="primary"
                size="md"
              >
                {isGenerating ? (
                  <>
                    <span className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Generating...
                  </>
                ) : (
                  "Generate Report"
                )}
              </Button>

              <Button
                onClick={handlePdfGeneration}
                disabled={
                  isLoadingPdf || !reportData
                }
                variant="secondary"
                size="md"
              >
                {isLoadingPdf ? (
                  <>
                    <span className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Preparing Preview...
                  </>
                ) : (
                  "Preview PDF Report"
                )}
              </Button>
            </div>
          </div>

          {reportData && (
            <>
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
                    {formatTime(
                      reportData.averageServiceTime
                    )}
                  </p>
                </div>
              </div>

              {/* Service Types Breakdown */}
              <div className="mb-10">
                <h3 className="text-xl font-bold text-sky-800 mb-4">
                  Service Types Breakdown
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {reportData.serviceTypesBreakdown.map(
                    (service, index) => (
                      <div
                        key={index}
                        className="bg-white border border-sky-100 rounded-lg shadow-sm"
                      >
                        <div className="bg-sky-50 px-4 py-2 rounded-t-lg">
                          <h4 className="font-medium text-sky-800">
                            {service.serviceName}
                          </h4>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="min-w-full">
                            <thead>
                              <tr className="border-b border-sky-50">
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
                                (
                                  type,
                                  typeIndex
                                ) => (
                                  <tr
                                    key={
                                      typeIndex
                                    }
                                    className="border-b border-sky-50"
                                  >
                                    <td className="py-3 px-4">
                                      {
                                        type.typeName
                                      }
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
                  )}
                </div>
              </div>

              {/* Detailed Ticket Information */}
              {reportData.ticketDetails &&
                reportData.ticketDetails.length >
                  0 && (
                  <div className="mt-10">
                    <h3 className="text-xl font-bold text-sky-800 mb-4">
                      Detailed Ticket Information
                      <span className="text-sm font-normal ml-2 text-sky-600">
                        (Showing{" "}
                        {indexOfFirstTicket + 1}-
                        {Math.min(
                          indexOfLastTicket,
                          reportData.ticketDetails
                            .length
                        )}{" "}
                        of{" "}
                        {
                          reportData.ticketDetails
                            .length
                        }
                        )
                      </span>
                    </h3>

                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white border border-sky-100">
                        <thead>
                          <tr className="bg-sky-50">
                            <th className="py-3 px-4 text-left font-medium text-sky-700 border-b">
                              Ticket #
                            </th>
                            <th className="py-3 px-4 text-left font-medium text-sky-700 border-b">
                              Service
                            </th>
                            <th className="py-3 px-4 text-left font-medium text-sky-700 border-b">
                              Service Type
                            </th>
                            <th className="py-3 px-4 text-left font-medium text-sky-700 border-b">
                              Date & Time
                            </th>
                            <th className="py-3 px-4 text-left font-medium text-sky-700 border-b">
                              Service Time
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
                                  {
                                    ticket.ticketNumber
                                  }
                                </td>
                                <td className="py-3 px-4">
                                  {
                                    ticket.serviceName
                                  }
                                </td>
                                <td className="py-3 px-4">
                                  {
                                    ticket.serviceTypeName
                                  }
                                </td>
                                <td className="py-3 px-4">
                                  {
                                    ticket.dateTime
                                  }
                                </td>
                                <td className="py-3 px-4">
                                  {formatTime(
                                    ticket.serviceTime
                                  )}
                                </td>
                                <td className="py-3 px-4">
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
                    {reportData.ticketDetails
                      .length >
                      ticketsPerPage && (
                      <div className="mt-6 flex justify-center">
                        <div className="flex gap-2">
                          <Button
                            onClick={() =>
                              setCurrentPage(
                                (prev) =>
                                  Math.max(
                                    prev - 1,
                                    1
                                  )
                              )
                            }
                            disabled={
                              currentPage === 1
                            }
                            size="sm"
                          >
                            Previous
                          </Button>
                          <span className="px-4 py-2 text-sky-800">
                            Page {currentPage} of{" "}
                            {Math.ceil(
                              reportData
                                .ticketDetails
                                .length /
                                ticketsPerPage
                            )}
                          </span>
                          <Button
                            onClick={() =>
                              setCurrentPage(
                                (prev) =>
                                  Math.min(
                                    prev + 1,
                                    Math.ceil(
                                      reportData
                                        .ticketDetails
                                        .length /
                                        ticketsPerPage
                                    )
                                  )
                              )
                            }
                            disabled={
                              currentPage ===
                              Math.ceil(
                                reportData
                                  .ticketDetails
                                  .length /
                                  ticketsPerPage
                              )
                            }
                            size="sm"
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
            </>
          )}
        </div>
      </div>

      {/* PDF Preview Modal */}
      {showPdfPreview && pdfPreviewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-sky-800">
                PDF Report Preview
              </h3>
              <div className="flex gap-2">
                <a
                  href={pdfPreviewUrl}
                  download={`${serviceName}-report-${startDate}-to-${endDate}.pdf`}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                >
                  Download
                </a>
                <button
                  onClick={() => {
                    setShowPdfPreview(false);
                    if (pdfPreviewUrl)
                      URL.revokeObjectURL(
                        pdfPreviewUrl
                      );
                    setPdfPreviewUrl(null);
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-1 bg-gray-100">
              <iframe
                src={pdfPreviewUrl}
                className="w-full h-full border-0 bg-white"
                title="PDF Preview"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
