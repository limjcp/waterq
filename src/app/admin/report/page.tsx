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

type TicketDetail = {
  ticketNumber: string;
  prefix: string;
  serviceName: string;
  serviceTypeName: string;
  dateTime: string;
  serviceTime: number;
  remarks?: string; // Add remarks field
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
  ticketDetails: TicketDetail[]; // Added field for individual ticket details
};

// Add new type for report mode
type ReportMode = "staff" | "service";

export default function StaffReports() {
  const { status } = useSession();
  const [loading, setLoading] = useState(true);
  const [reportMode, setReportMode] =
    useState<ReportMode>("staff");
  const [staffMembers, setStaffMembers] =
    useState<StaffMember[]>([]);
  const [services, setServices] = useState<
    Service[]
  >([]);
  const [selectedStaff, setSelectedStaff] =
    useState<string>("");
  const [selectedService, setSelectedService] =
    useState<string>("");
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
  const [isLoadingPdf, setIsLoadingPdf] =
    useState(false);

  // New state for PDF preview
  const [showPdfPreview, setShowPdfPreview] =
    useState(false);
  const [pdfPreviewUrl, setPdfPreviewUrl] =
    useState<string | null>(null);

  // Add pagination for tickets display to improve performance
  const [currentPage, setCurrentPage] =
    useState(1);
  const ticketsPerPage = 50; // Limit number of tickets shown per page

  // Update useEffect to fetch both staff and services
  useEffect(() => {
    async function fetchData() {
      if (status === "authenticated") {
        try {
          const [staffRes, servicesRes] =
            await Promise.all([
              fetch("/api/user/list?role=STAFF"),
              fetch("/api/service/list"),
            ]);

          if (staffRes.ok) {
            const staffData =
              await staffRes.json();
            setStaffMembers(staffData);
          }

          if (servicesRes.ok) {
            const servicesData =
              await servicesRes.json();
            setServices(servicesData);
          }
        } catch (error) {
          console.error(
            "Error fetching data:",
            error
          );
        } finally {
          setLoading(false);
        }
      } else if (status === "unauthenticated") {
        setLoading(false);
      }
    }

    fetchData();
  }, [status]);

  // Cleanup effect for PDF preview URL
  useEffect(() => {
    return () => {
      if (pdfPreviewUrl) {
        URL.revokeObjectURL(pdfPreviewUrl);
      }
    };
  }, [pdfPreviewUrl]);

  // Update generate report function
  const generateReport = async () => {
    if (
      (reportMode === "staff" &&
        !selectedStaff) ||
      (reportMode === "service" &&
        !selectedService)
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

  // New function to generate and show PDF preview
  const previewPdf = async () => {
    if (!reportData) return;

    setIsLoadingPdf(true);

    try {
      const response = await fetch(
        "/api/reports/pdf",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reportData,
            startDate,
            endDate,
            reportMode,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      // Get the PDF blob from the response
      const blob = await response.blob();

      // Create a URL for the blob
      const url = URL.createObjectURL(blob);

      // Set the preview URL and show the preview
      setPdfPreviewUrl(url);
      setShowPdfPreview(true);
    } catch (error) {
      console.error(
        "Error generating PDF preview:",
        error
      );
      alert(
        "Failed to generate PDF preview. Please try again later."
      );
    } finally {
      setIsLoadingPdf(false);
    }
  };

  // Function to handle printing the PDF
  const printPdf = () => {
    if (!pdfPreviewUrl) return;

    // Open the PDF URL in a new window and trigger print
    const printWindow = window.open(
      pdfPreviewUrl
    );
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  // Function to download the PDF
  const downloadPdf = () => {
    if (!pdfPreviewUrl) return;

    const a = document.createElement("a");
    a.href = pdfPreviewUrl;
    a.download = `${reportMode}_report_${startDate}_${endDate}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Calculate pagination for ticket display
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
  const totalPages = reportData?.ticketDetails
    ? Math.ceil(
        reportData.ticketDetails.length /
          ticketsPerPage
      )
    : 0;

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
    <div className=" bg-gradient-to-br from-sky-50 to-sky-100 ">
      <div className="max-w-10xl mx-auto">
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
                  setReportMode(
                    e.target.value as ReportMode
                  );
                  setSelectedStaff("");
                  setSelectedService("");
                  setReportData(null);
                }}
                className="w-full px-4 py-2 border border-sky-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                aria-label="Select report type"
              >
                <option value="staff">
                  Staff Report
                </option>
                <option value="service">
                  Service Report
                </option>
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
                value={
                  reportMode === "staff"
                    ? selectedStaff
                    : selectedService
                }
                onChange={(e) =>
                  reportMode === "staff"
                    ? setSelectedStaff(
                        e.target.value
                      )
                    : setSelectedService(
                        e.target.value
                      )
                }
                className="w-full px-4 py-2 border border-sky-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                aria-label={
                  reportMode === "staff"
                    ? "Select staff member"
                    : "Select service"
                }
              >
                <option value="">
                  Select...
                </option>
                {reportMode === "staff"
                  ? staffMembers.map((staff) => (
                      <option
                        key={staff.id}
                        value={staff.username}
                      >
                        {staff.name}
                      </option>
                    ))
                  : services.map((service) => (
                      <option
                        key={service.id}
                        value={service.id}
                      >
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
                onChange={(e) =>
                  setStartDate(e.target.value)
                }
                className="w-full px-4 py-2 border border-sky-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                aria-label="Start date"
                title="Start date"
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
                aria-label="End date"
                title="End date"
              />
            </div>
          </div>
          <div className="flex justify-center">
            <Button
              onClick={generateReport}
              disabled={
                (reportMode === "staff"
                  ? !selectedStaff
                  : !selectedService) ||
                isGenerating
              }
              variant="success"
              size="md"
            >
              {isGenerating ? (
                <span className="flex items-center">
                  <span className="h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Generating...
                </span>
              ) : (
                "Generate Report"
              )}
            </Button>
          </div>
        </div>
        {reportData && (
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-sky-800">
                Report for {reportData.name}
              </h2>
              <Button
                onClick={previewPdf}
                disabled={isLoadingPdf}
                variant="success"
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
            {/* Service Type Detailed Breakdown */}
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
            )}
            {/* Modified detailed ticket information section with pagination */}
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
                                {ticket.dateTime}
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
                  {/* Pagination controls */}
                  {totalPages > 1 && (
                    <div className="flex justify-center mt-4 gap-2">
                      <Button
                        onClick={() =>
                          setCurrentPage(1)
                        }
                        disabled={
                          currentPage === 1
                        }
                        variant="secondary"
                        size="sm"
                      >
                        First
                      </Button>
                      <Button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.max(prev - 1, 1)
                          )
                        }
                        disabled={
                          currentPage === 1
                        }
                        variant="secondary"
                        size="sm"
                      >
                        Prev
                      </Button>
                      <div className="px-3 py-1">
                        Page {currentPage} of{" "}
                        {totalPages}
                      </div>
                      <Button
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(
                              prev + 1,
                              totalPages
                            )
                          )
                        }
                        disabled={
                          currentPage ===
                          totalPages
                        }
                        variant="secondary"
                        size="sm"
                      >
                        Next
                      </Button>
                      <Button
                        onClick={() =>
                          setCurrentPage(
                            totalPages
                          )
                        }
                        disabled={
                          currentPage ===
                          totalPages
                        }
                        variant="secondary"
                        size="sm"
                      >
                        Last
                      </Button>
                    </div>
                  )}
                </div>
              )}
          </div>
        )}{" "}
        {/* PDF Preview Modal - Full Screen */}
        {showPdfPreview && pdfPreviewUrl && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
            <div className="bg-white w-full h-full flex flex-col">
              <div className="p-4 bg-sky-100 flex justify-between items-center">
                <h2 className="text-xl font-bold text-sky-800">
                  PDF Report Preview
                </h2>
                <div className="flex gap-2">
                  <Button
                    onClick={printPdf}
                    variant="success"
                    size="sm"
                  >
                    Print Report
                  </Button>
                  <Button
                    onClick={downloadPdf}
                    variant="secondary"
                    size="sm"
                  >
                    Download PDF
                  </Button>
                  <Button
                    onClick={() =>
                      setShowPdfPreview(false)
                    }
                    variant="danger"
                    size="sm"
                  >
                    Close
                  </Button>
                </div>
              </div>
              <div className="flex-grow overflow-hidden">
                <iframe
                  src={pdfPreviewUrl}
                  className="w-full h-full border-0"
                  title="PDF Preview"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
