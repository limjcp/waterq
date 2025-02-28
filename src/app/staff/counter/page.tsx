"use client";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

type Ticket = {
  id: string;
  ticketNumber: number;
  prefix: string;
  status: string;
  isPrioritized: boolean;
  createdAt: string;
  counterId: string | null;
  serviceId: string;
  service?: {
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
  const [servingStartTime, setServingStartTime] = useState<Date | null>(null);

  // Add new state for user statistics
  const [userStats, setUserStats] = useState<UserStatistics>({
    totalServed: 0,
    todayServed: 0,
    averageServiceTime: 0,
  });

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
      // Start the timer
      if (!servingStartTime) {
        setServingStartTime(new Date());
        setElapsedTime(0);
      }

      timerId = setInterval(() => {
        if (servingStartTime) {
          const now = new Date();
          const seconds = Math.floor(
            (now.getTime() - servingStartTime.getTime()) / 1000
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
        }
      }, 1000);
    } else {
      // Reset the timer when not serving
      setServingStartTime(null);
      setElapsedTime(0);
      setFormattedTime("00:00");
    }

    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [servingTicketId, servingStartTime]);

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
  async function markServed(ticketId: string) {
    await fetch(`/api/tickets/${ticketId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "SERVED" }),
    });
    setServingTicketId(null);
    setCalledTicketId(null);
    setServingStartTime(null); // Reset timer when ticket is served

    // Refresh tickets and statistics
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
      }),
    });
    setCalledTicketId(null);
    setServingTicketId(ticketId);
    setServingStartTime(new Date()); // Start timer when serving begins
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

  async function handleTransferTicket() {
    if (!ticketToTransfer || !selectedServiceId) {
      return;
    }

    try {
      const response = await fetch(
        `/api/tickets/${ticketToTransfer}/transfer`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            serviceId: selectedServiceId,
          }),
        }
      );

      if (response.ok) {
        // Close modal and reset state
        setIsTransferModalOpen(false);
        setTicketToTransfer(null);
        setSelectedServiceId("");
        setServingTicketId(null);
        setServingStartTime(null); // Reset timer when ticket is transferred
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

  // Filter active tickets for this counter
  const activeTickets = tickets.filter(
    (ticket) =>
      ticket.status === "CALLED" || ticket.status === "SERVING"
        ? ticket.counterId === assignedCounterId // For called/serving tickets, only show ones assigned to this counter
        : ticket.serviceId === assignedCounterService // For pending tickets, show all for this service
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
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-sky-100 p-8">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-6">
        {/* Main content area */}
        <div className="flex-1 bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="text-3xl font-bold text-sky-800 mb-2">
            Staff Dashboard
          </h1>
          <h2 className="text-xl font-medium text-sky-600 mb-6">
            {session?.user?.assignedCounterName ||
              `Counter ID: ${assignedCounterId}`}
          </h2>

          <div className="mb-6">
            <button
              onClick={callNextTicket}
              className="bg-sky-500 hover:bg-sky-600 text-white font-medium py-2 px-4 rounded transition-colors"
              disabled={isAnyActive}
            >
              Call Next Ticket
            </button>
          </div>

          {/* Other Counters Status */}
          <h2 className="text-2xl font-bold text-sky-800 mb-4">
            Other {currentServingTicket?.service?.name || ""} Counters
          </h2>
          {otherCounterTickets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
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
                        {counter.ticket.prefix}
                        {counter.ticket.ticketNumber}
                        {counter.ticket.isPrioritized && " (PWD)"}
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
            <p className="text-center text-sky-600 mb-8">
              No other counters with this service.
            </p>
          )}

          {/* Active Tickets */}
          <h2 className="text-2xl font-bold text-sky-800 mb-4">
            Active Tickets
          </h2>
          {activeTickets.length ? (
            activeTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between border border-sky-100 p-4 rounded-lg mb-4"
              >
                <div>
                  <p className="text-xl font-semibold text-sky-700">
                    Ticket: {ticket.prefix}
                    {ticket.ticketNumber}
                    {ticket.isPrioritized && " (PWD)"}
                  </p>
                  <p className="text-sm text-sky-500">
                    Status: {ticket.status}
                  </p>
                </div>
                <div className="mt-4 sm:mt-0">
                  {ticket.status === "CALLED" && (
                    <>
                      <button
                        onClick={() => startServing(ticket.id)}
                        className="bg-sky-500 hover:bg-sky-600 text-white font-medium py-2 px-4 rounded transition-colors mr-2"
                      >
                        Start Serving
                      </button>
                      <button
                        onClick={() => markLapsed(ticket.id)}
                        className="bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 px-4 rounded transition-colors"
                      >
                        Mark as Lapsed
                      </button>
                    </>
                  )}
                  {ticket.status === "SERVING" && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => markServed(ticket.id)}
                        className="bg-sky-500 hover:bg-sky-600 text-white font-medium py-2 px-4 rounded transition-colors"
                      >
                        Mark as Served
                      </button>
                      {/* Show transfer button only for Payment counter */}
                      {isPaymentCounter && (
                        <button
                          onClick={() => openTransferModal(ticket.id)}
                          className="bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded transition-colors"
                        >
                          Transfer to Other Service
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-sky-600">
              No active tickets available.
            </p>
          )}

          {/* Lapsed Tickets Section */}
          <h2 className="text-2xl font-bold text-sky-800 mt-8 mb-4">
            Lapsed Tickets
          </h2>
          {lapsedTickets.length ? (
            lapsedTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between border border-amber-100 p-4 rounded-lg mb-4"
              >
                <div>
                  <p className="text-xl font-semibold text-amber-700">
                    Ticket: {ticket.prefix}
                    {ticket.ticketNumber}
                  </p>
                  <p className="text-sm text-amber-500">
                    Status: {ticket.status}
                  </p>
                </div>
                <div className="mt-4 sm:mt-0">
                  <button
                    onClick={() => recallTicket(ticket.id)}
                    className="bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 px-4 rounded transition-colors"
                    disabled={
                      calledTicketId !== null || servingTicketId !== null
                    }
                  >
                    Recall Ticket
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-amber-600">No lapsed tickets.</p>
          )}

          {/* Returning Tickets Section - for CW and NSA only */}
          {!isPaymentCounter && (
            <>
              <h2 className="text-2xl font-bold text-sky-800 mt-8 mb-4">
                Returning Tickets
              </h2>
              {returningTickets.length ? (
                returningTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between border border-purple-100 p-4 rounded-lg mb-4"
                  >
                    <div>
                      <p className="text-xl font-semibold text-purple-700">
                        Ticket: {ticket.prefix}
                        {ticket.ticketNumber}
                        {ticket.isPrioritized && " (PWD)"}
                      </p>
                      <p className="text-sm text-purple-500">
                        Status: {ticket.status}
                      </p>
                      <p className="text-xs text-gray-500">
                        Transferred from Payment
                      </p>
                    </div>
                    <div className="mt-4 sm:mt-0">
                      <button
                        onClick={() => recallTicket(ticket.id)}
                        className="bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-4 rounded transition-colors"
                        disabled={
                          calledTicketId !== null || servingTicketId !== null
                        }
                      >
                        Call Ticket
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-purple-600">
                  No returning tickets.
                </p>
              )}
            </>
          )}
        </div>

        {/* Sidebar section */}
        <div className="lg:w-80 space-y-6">
          {/* Current serving ticket card */}
          <div className="bg-white rounded-2xl shadow-2xl p-6 h-fit sticky top-8">
            <h2 className="text-xl font-bold text-sky-800 mb-4 text-center">
              Currently Serving
            </h2>
            {currentServingTicket ? (
              <div className="flex flex-col items-center">
                <div className="bg-sky-100 rounded-full w-32 h-32 flex items-center justify-center mb-4">
                  <span className="text-3xl font-bold text-sky-700">
                    {currentServingTicket.prefix}
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
                    onClick={() => markServed(currentServingTicket.id)}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                  >
                    Complete Transaction
                  </button>
                  {isPaymentCounter && (
                    <button
                      onClick={() => openTransferModal(currentServingTicket.id)}
                      className="w-full mt-2 bg-purple-500 hover:bg-purple-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
                    >
                      Transfer Ticket
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <p>No ticket currently being served</p>
              </div>
            )}
          </div>

          {/* New User Statistics Card */}
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
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Destination Service
              </label>
              <select
                value={selectedServiceId}
                onChange={(e) => setSelectedServiceId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <option value="">Select a service...</option>
                {availableServices.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-2">
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
              <button
                onClick={handleTransferTicket}
                disabled={!selectedServiceId}
                className={`px-4 py-2 rounded-md text-white ${
                  selectedServiceId
                    ? "bg-sky-500 hover:bg-sky-600"
                    : "bg-sky-300 cursor-not-allowed"
                }`}
              >
                Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
