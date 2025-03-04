"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
type Ticket = {
  id: string;
  ticketNumber: number;
  prefix: string;
  status: string;
  isPrioritized: boolean;
  createdAt: string;
  counterId: string | null;
  serviceId: string;
  servingStart: string | null;
  serviceTypeId: string | null;
  service?: {
    id: string;
    name: string;
    code: string;
  };
  serviceType?: {
    id: string;
    name: string;
    code: string;
  };
};

type Service = {
  id: string;
  name: string;
  code: string;
};

type CounterStatus = {
  counterId: string;
  counterName: string;
  ticket: Ticket | null;
};

// Add new type for user statistics
type UserStatistics = {
  totalServed: number;
  todayServed: number;
  averageServiceTime: number;
};

// Add ServiceType type
type ServiceType = {
  id: string;
  name: string;
  code: string;
  serviceId: string;
};

// Helper function to get user initials
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    // Get first letter of first name and first letter of last name
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  } else if (parts.length === 1 && parts[0]) {
    // If only one name, get first letter
    return parts[0][0].toUpperCase();
  }
  return "U"; // Default if no name is available
}

export default function StaffDashboard() {
  const { data: session, status } = useSession();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [calledTicketId, setCalledTicketId] = useState<string | null>(null);
  const [servingTicketId, setServingTicketId] = useState<string | null>(null);
  const [assignedCounterId, setAssignedCounterId] = useState<string | null>(
    null
  );
  const [assignedCounterService, setAssignedCounterService] = useState<
    string | null
  >(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [ticketToTransfer, setTicketToTransfer] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Add new state for other counters with same service
  const [otherCounterTickets, setOtherCounterTickets] = useState<
    CounterStatus[]
  >([]);

  // New state for timer
  const [elapsedTime, setElapsedTime] = useState(0);
  const [formattedTime, setFormattedTime] = useState("00:00");

  // Add new state for user statistics
  const [userStats, setUserStats] = useState<UserStatistics>({
    totalServed: 0,
    todayServed: 0,
    averageServiceTime: 0,
  });

  // Add new state for service types and modal
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [isServiceTypeModalOpen, setIsServiceTypeModalOpen] = useState(false);
  const [selectedServiceTypeId, setSelectedServiceTypeId] =
    useState<string>("");
  const [ticketToComplete, setTicketToComplete] = useState<string | null>(null);

  // Add new state for profile menu
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Add click handler for sign out
  const handleSignOut = () => {
    window.location.href = "/api/auth/signout";
  };

  // Fetch assigned counter ID when session is available
  useEffect(() => {
    async function getAssignedCounter() {
      if (session?.user) {
        try {
          const res = await fetch(
            `/api/user/counter?username=${session.user.username}`
          );
          if (res.ok) {
            const data = await res.json();
            setAssignedCounterId(data.assignedCounterId);
            if (data.assignedCounter) {
              setAssignedCounterService(data.assignedCounter.serviceId);
            }
          }
        } catch (error) {
          console.error("Error fetching assigned counter:", error);
        } finally {
          setLoading(false);
        }
      }
    }

    if (status === "authenticated") {
      getAssignedCounter();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [session, status]);

  // Timer effect for serving ticket
  useEffect(() => {
    let timerId: NodeJS.Timeout;

    if (servingTicketId) {
      const currentTicket = tickets.find(
        (ticket) => ticket.id === servingTicketId
      );
      const ticketServingStart = currentTicket?.servingStart
        ? new Date(currentTicket.servingStart)
        : null;

      if (ticketServingStart) {
        timerId = setInterval(() => {
          const now = new Date();
          const seconds = Math.floor(
            (now.getTime() - ticketServingStart.getTime()) / 1000
          );
          setElapsedTime(seconds);

          // Format time as MM:SS
          const minutes = Math.floor(seconds / 60);
          const remainingSeconds = seconds % 60;
          setFormattedTime(
            `${minutes.toString().padStart(2, "0")}:${remainingSeconds
              .toString()
              .padStart(2, "0")}`
          );
        }, 1000);
      }
    } else {
      // Reset the timer when not serving
      setElapsedTime(0);
      setFormattedTime("00:00");
    }

    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [servingTicketId, tickets]);

  // Fetch available services for transfer (exclude current service)
  useEffect(() => {
    async function fetchServices() {
      if (assignedCounterService) {
        try {
          const res = await fetch("/api/services");
          if (res.ok) {
            const services = await res.json();
            // Filter out the current service
            const filteredServices = services.filter(
              (service: Service) =>
                service.id !== assignedCounterService &&
                (service.code === "CW" || service.code === "NSA") // Only allow transfers to CW or NSA
            );
            setAvailableServices(filteredServices);
          }
        } catch (error) {
          console.error("Error fetching services:", error);
        }
      }
    }

    if (assignedCounterService) {
      fetchServices();
    }
  }, [assignedCounterService]);

  // Fetch tickets when assigned counter ID is available
  useEffect(() => {
    if (assignedCounterId) {
      fetchTickets();
      const interval = setInterval(fetchTickets, 10000);
      return () => clearInterval(interval);
    }
  }, [assignedCounterId, assignedCounterService]);

  // Add useEffect to fetch service types
  useEffect(() => {
    async function fetchServiceTypes() {
      if (assignedCounterService) {
        try {
          const res = await fetch(
            `/api/servicetypes?serviceId=${assignedCounterService}`
          );
          if (res.ok) {
            const types = await res.json();
            setServiceTypes(types);
          }
        } catch (error) {
          console.error("Error fetching service types:", error);
        }
      }
    }

    if (assignedCounterService) {
      fetchServiceTypes();
    }
  }, [assignedCounterService]);

  async function fetchTickets() {
    if (!assignedCounterId || !assignedCounterService) return;

    try {
      // First, get the counter info to reliably determine service type
      const counterRes = await fetch(`/api/counter/${assignedCounterId}`);
      let counterServiceCode = "";
      if (counterRes.ok) {
        const counterData = await counterRes.json();
        counterServiceCode = counterData.service?.code || "";
      }

      // Fetch all tickets
      const res = await fetch("/api/tickets/list");
      const allTickets = await res.json();

      // Get tickets assigned to this counter (currently being served or called)
      const assignedToCounter = allTickets.filter(
        (ticket: Ticket) => ticket.counterId === assignedCounterId
      );

      // Get pending tickets for this counter's service that aren't assigned to any counter
      const pendingServiceTickets = allTickets.filter(
        (ticket: Ticket) =>
          ticket.status === "PENDING" &&
          ticket.serviceId === assignedCounterService &&
          ticket.counterId === null
      );

      // For Customer Welfare or New Service Application, also get returning tickets
      let returningTickets: Ticket[] = [];
      if (["CW", "NSA"].includes(counterServiceCode)) {
        const returningRes = await fetch(
          `/api/tickets/returning?serviceId=${assignedCounterService}`
        );
        if (returningRes.ok) {
          returningTickets = await returningRes.json();
        }
      }

      // Get tickets being handled by other counters with the same service
      const otherCountersRes = await fetch(
        `/api/tickets/same-service?serviceId=${assignedCounterService}&excludeCounterId=${assignedCounterId}`
      );
      if (otherCountersRes.ok) {
        const otherCounters = await otherCountersRes.json();
        setOtherCounterTickets(otherCounters);
      }

      // Rest of the function remains the same...
      const combinedTickets = [
        ...assignedToCounter,
        ...pendingServiceTickets,
        ...returningTickets,
      ];

      // Order tickets: prioritized first, then by creation time
      const sortedTickets = combinedTickets.sort((a: Ticket, b: Ticket) => {
        if (a.isPrioritized === b.isPrioritized) {
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        }
        return b.isPrioritized ? 1 : -1;
      });

      setTickets(sortedTickets);

      const calledTicket = sortedTickets.find(
        (ticket: Ticket) =>
          ticket.status === "CALLED" && ticket.counterId === assignedCounterId
      );
      setCalledTicketId(calledTicket ? calledTicket.id : null);

      const servingTicket = sortedTickets.find(
        (ticket: Ticket) =>
          ticket.status === "SERVING" && ticket.counterId === assignedCounterId
      );
      setServingTicketId(servingTicket ? servingTicket.id : null);
    } catch (error) {
      console.error("Error fetching tickets:", error);
    }
  }

  // Fetch user statistics when session is available
  useEffect(() => {
    async function fetchUserStatistics() {
      if (session?.user) {
        try {
          const res = await fetch(
            `/api/user/statistics?username=${session.user.username}`
          );
          if (res.ok) {
            const stats = await res.json();
            setUserStats(stats);
          }
        } catch (error) {
          console.error("Error fetching user statistics:", error);
        }
      }
    }

    if (status === "authenticated") {
      fetchUserStatistics();
      // Refresh stats every minute
      const interval = setInterval(fetchUserStatistics, 60000);
      return () => clearInterval(interval);
    }
  }, [session, status]);

  // Add function to format average time
  function formatAverageTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }

  async function callNextTicket() {
    if (!assignedCounterId || !assignedCounterService) return;

    // First try to find a prioritized pending ticket for this service
    let nextTicket = tickets.find(
      (ticket) =>
        (ticket.status === "PENDING" || ticket.status === "RETURNING") &&
        ticket.isPrioritized &&
        (ticket.serviceId === assignedCounterService ||
          ticket.status === "RETURNING")
    );

    // If no prioritized ticket, get the oldest pending ticket
    if (!nextTicket) {
      nextTicket = tickets.find(
        (ticket) =>
          (ticket.status === "PENDING" || ticket.status === "RETURNING") &&
          (ticket.serviceId === assignedCounterService ||
            ticket.status === "RETURNING")
      );
    }

    if (nextTicket) {
      await fetch(`/api/tickets/${nextTicket.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "CALLED",
          counterId: assignedCounterId, // Assignment happens here
        }),
      });
      setCalledTicketId(nextTicket.id);
      fetchTickets();
    }
  }

  // Modify markServed to open service type modal first
  function openServiceTypeModal(ticketId: string) {
    setTicketToComplete(ticketId);
    setIsServiceTypeModalOpen(true);
  }

  // New function to complete transaction with service type
  async function completeTransaction(serviceTypeId: string) {
    if (!ticketToComplete || !serviceTypeId) {
      console.error("Missing required data:", {
        ticketToComplete,
        serviceTypeId,
      });
      return;
    }

    try {
      const response = await fetch(`/api/tickets/${ticketToComplete}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "SERVED",
          serviceTypeId: serviceTypeId,
          servingEnd: new Date(), // Add serving end time
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error completing transaction:", errorData);
        return;
      }

      // Reset states and refresh data
      setIsServiceTypeModalOpen(false);
      setTicketToComplete(null);
      setSelectedServiceTypeId("");
      setServingTicketId(null);
      setCalledTicketId(null);
      fetchTickets();

      // Refresh user statistics
      if (session?.user) {
        const res = await fetch(
          `/api/user/statistics?username=${session.user.username}`
        );
        if (res.ok) {
          const stats = await res.json();
          setUserStats(stats);
        }
      }
    } catch (error) {
      console.error("Error completing transaction:", error);
    }
  }

  async function markServed(ticketId: string) {
    await fetch(`/api/tickets/${ticketId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "SERVED" }),
    });
    setServingTicketId(null);
    setCalledTicketId(null);
    fetchTickets();

    // Also refresh user statistics
    if (session?.user) {
      const res = await fetch(
        `/api/user/statistics?username=${session.user.username}`
      );
      if (res.ok) {
        const stats = await res.json();
        setUserStats(stats);
      }
    }
  }

  async function markLapsed(ticketId: string) {
    await fetch(`/api/tickets/${ticketId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "LAPSED" }),
    });
    fetchTickets();
  }

  async function startServing(ticketId: string) {
    await fetch(`/api/tickets/${ticketId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "SERVING",
        counterId: assignedCounterId,
        servingStart: new Date(), // This sends the timestamp to be saved in the database
      }),
    });
    setCalledTicketId(null);
    setServingTicketId(ticketId);
    fetchTickets();
  }

  async function recallTicket(ticketId: string) {
    if (!assignedCounterId) return;

    await fetch(`/api/tickets/${ticketId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "CALLED",
        counterId: assignedCounterId,
      }),
    });
    fetchTickets();
  }

  function openTransferModal(ticketId: string) {
    setTicketToTransfer(ticketId);
    setIsTransferModalOpen(true);
  }

  async function handleTransferTicket(serviceId?: string) {
    if (!ticketToTransfer) {
      return;
    }

    // Use provided serviceId or fall back to the state value
    const targetServiceId = serviceId || selectedServiceId;

    if (!targetServiceId) {
      return;
    }

    try {
      const response = await fetch(
        `/api/tickets/${ticketToTransfer}/transfer`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            serviceId: targetServiceId,
          }),
        }
      );

      if (response.ok) {
        // Close modal and reset state
        setIsTransferModalOpen(false);
        setTicketToTransfer(null);
        setSelectedServiceId("");
        setServingTicketId(null);
        fetchTickets();
      } else {
        console.error("Failed to transfer ticket");
      }
    } catch (error) {
      console.error("Error transferring ticket:", error);
    }
  }

  // Get the counter service code
  const isPaymentCounter = tickets.some(
    (ticket) =>
      ticket.counterId === assignedCounterId && ticket.service?.code === "P"
  );

  // Update filter for active tickets to exclude called and serving tickets
  const activeTickets = tickets.filter(
    (ticket) =>
      ticket.status !== "LAPSED" &&
      ticket.status !== "CALLED" &&
      ticket.status !== "SERVING" &&
      ticket.status === "PENDING" &&
      ticket.serviceId === assignedCounterService
  );

  const lapsedTickets = tickets.filter((ticket) => ticket.status === "LAPSED");

  // For Customer Welfare and New Service Application, filter returning tickets
  const returningTickets = !isPaymentCounter
    ? tickets.filter((ticket) => ticket.status === "RETURNING")
    : [];

  // Disable if a ticket is already in CALLED or SERVING
  const isAnyActive = calledTicketId !== null || servingTicketId !== null;

  // Get current serving ticket
  const currentServingTicket = tickets.find(
    (ticket) => ticket.id === servingTicketId
  );

  // Add a new check for pending tickets
  const hasPendingTickets = tickets.some(
    (ticket) =>
      (ticket.status === "PENDING" &&
        ticket.serviceId === assignedCounterService) ||
      (ticket.status === "RETURNING" && !isPaymentCounter)
  );

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
            Staff Dashboard
          </h1>
          <p className="text-xl text-red-500">
            Please log in to access the dashboard.
          </p>
        </div>
      </div>
    );
  }

  if (!assignedCounterId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-sky-100 p-8">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl p-8 text-center">
          <h1 className="text-3xl font-bold text-sky-800 mb-6">
            Staff Dashboard
          </h1>
          <p className="text-xl text-red-500">
            You are not assigned to any counter. Please contact an
            administrator.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-sky-100">
      {/* Full-width header that stretches edge to edge */}
      <div className="bg-white shadow-lg p-0 mb-8 w-full sticky top-0">
        <div className="w-full flex justify-between items-center px-8">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <Image src="/wdlogo.png" alt="WD Logo" width={120} height={120} />

            <div>
              <h1 className="text-3xl font-bold text-sky-800 mb-2">
                Staff Dashboard
              </h1>
              <h2 className="text-xl font-medium text-sky-600">
                {session?.user?.assignedCounterName ||
                  `Counter ID: ${assignedCounterId}`}
              </h2>
            </div>
          </div>

          {/* User Profile */}
          {session?.user && (
            <div className="flex items-center relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center cursor-pointer"
              >
                <div className="bg-sky-600 text-white rounded-full w-20 h-20 flex items-center justify-center font-bold text-lg mr-3">
                  {getInitials(session.user.name || "")}
                </div>
                <span className="text-sky-800 font-extrabold">
                  {session.user.name || "Staff User"}
                </span>
              </button>

              {/* Profile Menu Dropdown */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 top-24 w-48 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50">
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left px-4 py-2 text-gray-700 hover:bg-sky-50 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main content area with sections and sidebar - FULL WIDTH */}
      <div className="w-full px-8 flex flex-col lg:flex-row gap-6">
        {/* Main content area - EXPANDED */}
        <div className="flex-1 space-y-6">
          {/* Active and Lapsed Tickets side by side */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Lapsed Tickets Section - LEFT SIDE */}
            <div className="bg-white rounded-2xl shadow-2xl p-6 flex-1">
              <h2 className="text-2xl font-bold text-sky-800 mb-4">
                Lapsed Tickets
              </h2>
              {lapsedTickets.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {lapsedTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="border border-amber-100 rounded-lg p-4 bg-amber-50"
                    >
                      <p className="font-medium text-amber-700">
                        {ticket.isPrioritized ? "PWD-" : ""}
                        {ticket.service?.code}-{ticket.ticketNumber}
                      </p>
                      <p className="text-xs text-amber-600 mt-1">
                        Status: {ticket.status}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-amber-600">No lapsed tickets.</p>
              )}
            </div>

            {/* Active Tickets - RIGHT SIDE - UPDATED TO SHOW NEXT IN LINE */}
            <div className="bg-white rounded-2xl shadow-2xl p-6 flex-1">
              <h2 className="text-2xl font-bold text-sky-800 mb-4">
                Next in Line
              </h2>
              {activeTickets.length ? (
                <div className="flex flex-col items-center">
                  {/* Display just the first waiting ticket */}
                  <div className="bg-sky-50 rounded-lg w-40 h-20 flex items-center justify-center mb-4">
                    <span className="text-2xl font-bold text-sky-700">
                      {activeTickets[0].isPrioritized ? "PWD-" : ""}
                      {activeTickets[0].service?.code}-
                      {activeTickets[0].ticketNumber}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-sky-600 mb-1">
                    {activeTickets[0].service?.name || "Unknown Service"}
                  </p>
                  {activeTickets[0].isPrioritized && (
                    <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-medium mb-2">
                      Priority
                    </span>
                  )}
                  <p className="text-xs text-sky-600 mt-1">Status: Waiting</p>

                  {/* Show pending count if there are more waiting tickets */}
                  {activeTickets.length > 1 && (
                    <div className="mt-4 bg-sky-50 border border-sky-100 rounded-lg py-2 px-4">
                      <p className="text-center text-sky-700 font-medium">
                        Waiting: {activeTickets.length - 1} ticket
                        {activeTickets.length - 1 !== 1 ? "s" : ""}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center text-sky-600 py-10">
                  No tickets waiting in queue
                </p>
              )}
            </div>
          </div>

          {/* Returning Tickets Section - EXPANDED GRID */}
          {!isPaymentCounter && (
            <div className="bg-white rounded-2xl shadow-2xl p-6">
              <h2 className="text-2xl font-bold text-sky-800 mb-4">
                Returning Tickets
              </h2>
              {returningTickets.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {returningTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="border border-purple-100 rounded-lg p-4 bg-purple-50"
                    >
                      <p className="font-medium text-purple-700">
                        {ticket.isPrioritized ? "PWD-" : ""}
                        {ticket.service?.code}-{ticket.ticketNumber}
                      </p>
                      <p className="text-xs text-purple-600 mt-1">
                        Status: {ticket.status}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Transferred from Payment
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-purple-600">
                  No returning tickets.
                </p>
              )}
            </div>
          )}

          {/* Other Counters Status - EXPANDED GRID */}
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            <h2 className="text-2xl font-bold text-sky-800 mb-4">
              Other {currentServingTicket?.service?.name || ""} Counters
            </h2>
            {otherCounterTickets.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {otherCounterTickets.map((counter) => (
                  <div
                    key={counter.counterId}
                    className="border border-sky-100 rounded-lg p-4 bg-sky-50"
                  >
                    <p className="font-medium text-sky-700">
                      {counter.counterName}
                    </p>
                    {counter.ticket ? (
                      <div className="mt-2">
                        <span className="inline-block bg-sky-100 text-sky-800 px-3 py-1 rounded-full text-sm font-medium">
                          {counter.ticket.isPrioritized ? "PWD-" : ""}
                          {counter.ticket.service?.code}-
                          {counter.ticket.ticketNumber}
                        </span>
                        <span className="text-xs text-sky-600 block mt-1">
                          Status: {counter.ticket.status}
                        </span>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 mt-2">
                        No active tickets
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sky-600">
                No other counters with this service.
              </p>
            )}
          </div>
        </div>

        {/* Sidebar section - MODIFIED FROM VERTICAL TO HORIZONTAL */}
        <div className="lg:w-auto space-y-0 flex flex-col sm:flex-row gap-6">
          {/* Current serving ticket card */}
          <div className="bg-white rounded-2xl shadow-2xl p-6 h-[600px] w-[400px]">
            <h2 className="text-xl font-bold text-sky-800 mb-4 text-center">
              Currently Serving
            </h2>
            <div className="h-[520px] flex items-center justify-center">
              {currentServingTicket ? (
                <div className="flex flex-col items-center w-full">
                  <div className="bg-sky-100 rounded-lg w-48 h-48 flex items-center justify-center mb-4">
                    <span className="text-3xl font-bold text-sky-700">
                      {currentServingTicket.isPrioritized ? "PWD-" : ""}
                      {currentServingTicket.service?.code}-
                      {currentServingTicket.ticketNumber}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-sky-600 mb-1">
                    {currentServingTicket.service?.name || "Unknown Service"}
                  </p>
                  {currentServingTicket.isPrioritized && (
                    <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-medium mb-4">
                      Priority
                    </span>
                  )}
                  <div className="mt-4 w-full">
                    <p className="text-sm text-gray-500 text-center mb-1">
                      Transaction Time
                    </p>
                    <div className="bg-gray-100 rounded-lg p-3 flex items-center justify-center">
                      <div className="text-2xl font-mono font-bold text-sky-800">
                        {formattedTime}
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 w-full">
                    <button
                      onClick={() =>
                        openServiceTypeModal(currentServingTicket.id)
                      }
                      className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                    >
                      Complete Transaction
                    </button>
                    {isPaymentCounter && (
                      <button
                        onClick={() =>
                          openTransferModal(currentServingTicket.id)
                        }
                        className="w-full mt-2 bg-purple-500 hover:bg-purple-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                      >
                        Transfer Ticket
                      </button>
                    )}
                  </div>
                </div>
              ) : calledTicketId ? (
                <div className="flex flex-col items-center w-full">
                  {tickets
                    .filter((t) => t.id === calledTicketId)
                    .map((ticket) => (
                      <div
                        key={ticket.id}
                        className="flex flex-col items-center w-full"
                      >
                        <div className="bg-amber-100 rounded-lg w-48 h-48 flex items-center justify-center mb-4">
                          <span className="text-3xl font-bold text-amber-700">
                            {ticket.isPrioritized ? "PWD-" : ""}
                            {ticket.service?.code}-{ticket.ticketNumber}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-amber-600 mb-1">
                          {ticket.service?.name || "Unknown Service"}
                        </p>
                        {ticket.isPrioritized && (
                          <span className="bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full font-medium mb-4">
                            Priority
                          </span>
                        )}
                        <p className="text-center text-amber-600 mb-4">
                          Ticket Called
                        </p>
                        <div className="mt-4 w-full space-y-2">
                          <button
                            onClick={() => startServing(ticket.id)}
                            className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                          >
                            Start Serving
                          </button>
                          <button
                            onClick={() => markLapsed(ticket.id)}
                            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                          >
                            Mark as Lapsed
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : lapsedTickets.length > 0 || returningTickets.length > 0 ? (
                <div className="flex flex-col items-center w-full">
                  <p className="text-center text-sky-700 mb-4">
                    Available Actions
                  </p>

                  {lapsedTickets.length > 0 && (
                    <div className="w-full mb-3">
                      <h3 className="text-sm font-medium text-amber-700 mb-2">
                        Lapsed Tickets
                      </h3>
                      {lapsedTickets.map((ticket) => (
                        <div
                          key={ticket.id}
                          className="bg-amber-50 p-2 rounded-lg mb-2 flex justify-between items-center"
                        >
                          <span>
                            {ticket.isPrioritized ? "PWD-" : ""}
                            {ticket.service?.code}-{ticket.ticketNumber}
                          </span>
                          <button
                            onClick={() => recallTicket(ticket.id)}
                            className="bg-amber-500 hover:bg-amber-600 text-white font-medium py-1 px-3 rounded text-sm transition-colors"
                          >
                            Recall
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {returningTickets.length > 0 && (
                    <div className="w-full mb-4">
                      <h3 className="text-sm font-medium text-purple-700 mb-2">
                        Returning Tickets
                      </h3>
                      {returningTickets.map((ticket) => (
                        <div
                          key={ticket.id}
                          className="bg-purple-50 p-2 rounded-lg mb-2 flex justify-between items-center"
                        >
                          <span>
                            {ticket.isPrioritized ? "PWD-" : ""}
                            {ticket.service?.code}-{ticket.ticketNumber}
                          </span>
                          <button
                            onClick={() => recallTicket(ticket.id)}
                            className="bg-purple-500 hover:bg-purple-600 text-white font-medium py-1 px-3 rounded text-sm transition-colors"
                          >
                            Call
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Call Next Ticket button at the bottom */}
                  <div className="w-full mt-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={callNextTicket}
                      disabled={!hasPendingTickets}
                      className={`w-full py-3 px-4 rounded-lg transition-colors text-white font-medium ${
                        hasPendingTickets
                          ? "bg-sky-500 hover:bg-sky-600"
                          : "bg-gray-300 cursor-not-allowed"
                      }`}
                    >
                      Call Next Ticket
                    </button>
                    {!hasPendingTickets && (
                      <p className="text-xs text-gray-500 text-center mt-1">
                        No pending tickets in queue
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center w-full">
                  <p className="text-center text-gray-500 mb-6">
                    No ticket currently being served
                  </p>
                  <button
                    onClick={callNextTicket}
                    disabled={!hasPendingTickets}
                    className={`w-full py-3 px-4 rounded-lg transition-colors text-white font-medium ${
                      hasPendingTickets
                        ? "bg-sky-500 hover:bg-sky-600"
                        : "bg-gray-300 cursor-not-allowed"
                    }`}
                  >
                    Call Next Ticket
                  </button>
                  {!hasPendingTickets && (
                    <p className="text-xs text-gray-500 text-center mt-1">
                      No pending tickets in queue
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* User Statistics Card - NOW SIDE BY SIDE */}
          <div className="bg-white rounded-2xl shadow-2xl p-6 h-fit">
            <h2 className="text-xl font-bold text-sky-800 mb-4 text-center">
              Your Statistics
            </h2>
            <div className="space-y-4">
              <div className="bg-sky-50 rounded-lg p-3">
                <p className="text-sm text-sky-700 font-medium">Total Served</p>
                <p className="text-2xl font-bold text-sky-800">
                  {userStats.totalServed}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-sm text-green-700 font-medium">Today</p>
                <p className="text-2xl font-bold text-green-800">
                  {userStats.todayServed}
                </p>
              </div>
              <div className="bg-amber-50 rounded-lg p-3">
                <p className="text-sm text-amber-700 font-medium">
                  Avg. Service Time
                </p>
                <p className="text-2xl font-bold text-amber-800">
                  {formatAverageTime(userStats.averageServiceTime)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-2xl">
            <h3 className="text-lg font-semibold mb-4">Transfer Ticket</h3>
            <div className="mb-6">
              <p className="block text-sm font-medium text-gray-700 mb-3">
                Select Destination Service
              </p>
              <div className="space-y-2">
                {availableServices.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => {
                      setSelectedServiceId(service.id);
                      handleTransferTicket(service.id);
                    }}
                    className="w-full bg-sky-500 hover:bg-sky-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-between"
                  >
                    <span>{service.name}</span>
                    <span className="text-xs bg-sky-700 px-2 py-1 rounded">
                      {service.code}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setIsTransferModalOpen(false);
                  setTicketToTransfer(null);
                  setSelectedServiceId("");
                }}
                className="px-4 py-2 bg-gray-200 rounded-md text-gray-700 hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Service Type Modal */}
      {isServiceTypeModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-2xl">
            <h3 className="text-lg font-semibold mb-4">Select Service Type</h3>
            <div className="mb-6">
              <p className="block text-sm font-medium text-gray-700 mb-3">
                Choose the type of service provided
              </p>
              <div className="space-y-2">
                {serviceTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => completeTransaction(type.id)}
                    className="w-full bg-sky-500 hover:bg-sky-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-between"
                  >
                    <span>{type.name}</span>
                    <span className="text-xs bg-sky-700 px-2 py-1 rounded">
                      {type.code}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setIsServiceTypeModalOpen(false);
                  setTicketToComplete(null);
                  setSelectedServiceTypeId("");
                }}
                className="px-4 py-2 bg-gray-200 rounded-md text-gray-700 hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
