"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  PDFDownloadLink,
  Image,
} from "@react-pdf/renderer";

// Format time (seconds) as MM:SS
const formatTime = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

// Add type for ReportDocument props
type ReportDocumentProps = {
  reportData: ReportData;
  startDate: string;
  endDate: string;
  reportMode: ReportMode;
};

// Enhanced styles for better design
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 30,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    borderBottom: "2 solid #2563eb",
    paddingBottom: 15,
  },
  logo: {
    width: 80,
    height: 80,
    marginRight: 15,
  },
  headerText: {
    flex: 1,
  },
  organizationName: {
    fontSize: 20,
    color: "#1e40af",
    fontWeight: "bold",
    marginBottom: 5,
  },
  reportTitle: {
    fontSize: 24,
    color: "#2563eb",
    fontWeight: "bold",
  },
  subheader: {
    fontSize: 16,
    marginBottom: 5,
    color: "#1e40af",
    fontWeight: "bold",
  },
  reportInfo: {
    fontSize: 12,
    color: "#4b5563",
    marginBottom: 20,
    backgroundColor: "#f3f4f6",
    padding: 10,
    borderRadius: 4,
  },
  section: {
    margin: 10,
    padding: 10,
    backgroundColor: "#ffffff",
    borderRadius: 4,
    border: "1 solid #e5e7eb",
  },
  table: {
    width: "auto",
    marginVertical: 10,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    borderBottomStyle: "solid",
    alignItems: "center",
    minHeight: 28,
  },
  tableHeader: {
    backgroundColor: "#f8fafc",
  },
  tableCell: {
    flex: 1,
    padding: 8,
  },
  text: {
    fontSize: 11,
    color: "#374151",
  },
  bold: {
    fontWeight: "bold",
  },
  statContainer: {
    backgroundColor: "#f0f9ff",
    padding: 12,
    marginBottom: 10,
    borderRadius: 4,
    border: "1 solid #bae6fd",
  },
  statLabel: {
    fontSize: 12,
    color: "#0369a1",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    color: "#0284c7",
    fontWeight: "bold",
  },
});

// PDF Document Component
const ReportDocument = ({
  reportData,
  startDate,
  endDate,
  reportMode,
}: ReportDocumentProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.headerContainer}>
        <Image src="/wdlogo.png" style={styles.logo} />
        <View style={styles.headerText}>
          <Text style={styles.organizationName}>
            General Santos City Water District
          </Text>
          <Text style={styles.reportTitle}>
            {reportMode === "staff"
              ? "Staff Performance Report"
              : "Service Report"}
          </Text>
        </View>
      </View>

      <View style={styles.reportInfo}>
        <Text style={styles.text}>Report for: {reportData.name}</Text>
        <Text style={styles.text}>
          Period: {startDate} to {endDate}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.subheader}>Summary Statistics</Text>
        <View style={styles.statContainer}>
          <Text style={styles.statLabel}>Total Tickets Served</Text>
          <Text style={styles.statValue}>{reportData.ticketsServed}</Text>
        </View>
        <View style={styles.statContainer}>
          <Text style={styles.statLabel}>Average Service Time</Text>
          <Text style={styles.statValue}>
            {formatTime(reportData.averageServiceTime)}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.subheader}>Daily Performance</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={[styles.tableCell, styles.text, styles.bold]}>
              Date
            </Text>
            <Text style={[styles.tableCell, styles.text, styles.bold]}>
              Tickets
            </Text>
          </View>
          {reportData.serviceByDay.map((day, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.text]}>{day.date}</Text>
              <Text style={[styles.tableCell, styles.text]}>{day.count}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.subheader}>Service Type Analysis</Text>
        {reportData.serviceTypesBreakdown.map((service, index) => (
          <View key={index} style={{ marginBottom: 15 }}>
            <Text
              style={[
                styles.text,
                styles.bold,
                { marginVertical: 5, color: "#1e40af" },
              ]}
            >
              {service.serviceName}
            </Text>
            <View style={styles.table}>
              {service.types.map((type, typeIndex) => (
                <View key={typeIndex} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.text]}>
                    {type.typeName}
                  </Text>
                  <Text style={[styles.tableCell, styles.text]}>
                    {type.count}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    </Page>
  </Document>
);

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
  const { status } = useSession();
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
                aria-label="Select report type"
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
                aria-label={
                  reportMode === "staff"
                    ? "Select staff member"
                    : "Select service"
                }
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
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-sky-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                aria-label="End date"
                title="End date"
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
              <PDFDownloadLink
                document={
                  <ReportDocument
                    reportData={reportData}
                    startDate={startDate}
                    endDate={endDate}
                    reportMode={reportMode}
                  />
                }
                fileName={`${reportMode}_report_${reportData.name}_${startDate}_${endDate}.pdf`}
                className="bg-green-500 hover:bg-green-600 text-white font-medium px-4 py-2 rounded-lg transition-colors flex items-center"
              >
                {({ loading }) =>
                  loading ? "Preparing PDF..." : "Download PDF Report"
                }
              </PDFDownloadLink>
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
