"use client";
import React, {
  useEffect,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import io from "socket.io-client";
import Button from "@/components/Button";

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
    return (
      parts[0][0] + parts[parts.length - 1][0]
    ).toUpperCase();
  } else if (parts.length === 1 && parts[0]) {
    // If only one name, get first letter
    return parts[0][0].toUpperCase();
  }
  return "U"; // Default if no name is available
}

// Helper function to get the display service code for tickets
function getTicketDisplayCode(
  ticket: Ticket
): string {
  // Use the ticket's prefix instead of service code
  return (
    ticket.prefix || ticket.service?.code || ""
  );
}

// Format ticket number with leading zeros
function formatTicketNumber(
  number: number
): string {
  return String(number).padStart(3, "0");
}

// Add a new function to determine text size class based on ticket number length
function getTicketTextSizeClass(
  ticket: Ticket
): string {
  const displayCode =
    getTicketDisplayCode(ticket);
  const ticketText = `${
    ticket.isPrioritized ? "PWD-" : ""
  }${displayCode}-${formatTicketNumber(
    ticket.ticketNumber
  )}`;

  if (ticketText.length > 12) {
    return "text-6xl";
  } else if (ticketText.length > 9) {
    return "text-6xl";
  } else {
    return "text-6xl";
  }
}

export default function StaffDashboard() {
  const { data: session, status } = useSession();
  const [tickets, setTickets] = useState<
    Ticket[]
  >([]);
  const [calledTicketId, setCalledTicketId] =
    useState<string | null>(null);
  const [servingTicketId, setServingTicketId] =
    useState<string | null>(null);
  const [
    assignedCounterId,
    setAssignedCounterId,
  ] = useState<string | null>(null);
  const [
    assignedCounterService,
    setAssignedCounterService,
  ] = useState<string | null>(null);
  const [
    isTransferModalOpen,
    setIsTransferModalOpen,
  ] = useState(false);
  const [
    selectedServiceId,
    setSelectedServiceId,
  ] = useState<string>("");
  const [
    availableServices,
    setAvailableServices,
  ] = useState<Service[]>([]);
  const [ticketToTransfer, setTicketToTransfer] =
    useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Add new state for other counters with same service
  const [
    otherCounterTickets,
    setOtherCounterTickets,
  ] = useState<CounterStatus[]>([]);

  // New state for timer
  const [elapsedTime, setElapsedTime] =
    useState(0);
  const [formattedTime, setFormattedTime] =
    useState("00:00");

  // Add new state for user statistics
  const [userStats, setUserStats] =
    useState<UserStatistics>({
      totalServed: 0,
      todayServed: 0,
      averageServiceTime: 0,
    });

  // Add new state for service types and modal
  const [serviceTypes, setServiceTypes] =
    useState<ServiceType[]>([]);
  const [
    isServiceTypeModalOpen,
    setIsServiceTypeModalOpen,
  ] = useState(false);
  const [
    selectedServiceTypeId,
    setSelectedServiceTypeId,
  ] = useState<string>("");
  const [ticketToComplete, setTicketToComplete] =
    useState<string | null>(null);

  // Add new state for profile menu
  const [
    isProfileMenuOpen,
    setIsProfileMenuOpen,
  ] = useState(false);

  // Add a new state to trigger refreshes from socket events
  const [
    socketUpdateTrigger,
    setSocketUpdateTrigger,
  ] = useState(0);

  // Add new state for lapsed confirmation modal
  const [
    isLapsedConfirmModalOpen,
    setIsLapsedConfirmModalOpen,
  ] = useState(false);
  const [ticketToLapse, setTicketToLapse] =
    useState<string | null>(null);

  // Add new state for search query
  const [
    serviceTypeSearchQuery,
    setServiceTypeSearchQuery,
  ] = useState("");

  // Add new state for counter service information
  const [
    counterServiceCode,
    setCounterServiceCode,
  ] = useState("");

  // Add click handler for sign out
  const handleSignOut = () => {
    window.location.href = "/api/auth/signout";
  };

  // Add new state for service type confirmation modal
  const [
    isServiceTypeConfirmModalOpen,
    setIsServiceTypeConfirmModalOpen,
  ] = useState(false);
  const [
    serviceTypeToConfirm,
    setServiceTypeToConfirm,
  ] = useState<ServiceType | null>(null);

  // Add new state for transfer confirmation modal
  const [
    isTransferConfirmModalOpen,
    setIsTransferConfirmModalOpen,
  ] = useState(false);
  const [serviceToConfirm, setServiceToConfirm] =
    useState<Service | null>(null);

  // Add this near the other state variables
  const [
    showConfirmations,
    setShowConfirmations,
  ] = useState(true);

  // Add this useEffect to load the saved preference
  useEffect(() => {
    // Load saved confirmation preference when component mounts
    const savedPreference = localStorage.getItem(
      "showConfirmations"
    );
    if (savedPreference !== null) {
      setShowConfirmations(
        savedPreference === "true"
      );
    }
  }, []);

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
            setAssignedCounterId(
              data.assignedCounterId
            );
            if (data.assignedCounter) {
              setAssignedCounterService(
                data.assignedCounter.serviceId
              );
            }
          }
        } catch (error) {
          console.error(
            "Error fetching assigned counter:",
            error
          );
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
      const ticketServingStart =
        currentTicket?.servingStart
          ? new Date(currentTicket.servingStart)
          : null;

      if (ticketServingStart) {
        timerId = setInterval(() => {
          const now = new Date();
          const seconds = Math.floor(
            (now.getTime() -
              ticketServingStart.getTime()) /
              1000
          );
          setElapsedTime(seconds);

          // Format time as MM:SS
          const minutes = Math.floor(
            seconds / 60
          );
          const remainingSeconds = seconds % 60;
          setFormattedTime(
            `${minutes
              .toString()
              .padStart(
                2,
                "0"
              )}:${remainingSeconds
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
          const res = await fetch(
            "/api/services"
          );
          if (res.ok) {
            const services = await res.json();
            // Filter out the current service
            const filteredServices =
              services.filter(
                (service: Service) =>
                  service.id !==
                    assignedCounterService &&
                  (service.code === "CW" ||
                    service.code === "A") // Only allow transfers to CW or A
              );
            setAvailableServices(
              filteredServices
            );
          }
        } catch (error) {
          console.error(
            "Error fetching services:",
            error
          );
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
          console.error(
            "Error fetching service types:",
            error
          );
        }
      }
    }

    if (assignedCounterService) {
      fetchServiceTypes();
    }
  }, [assignedCounterService]);

  // Define functions inside component body
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
        console.error(
          "Error fetching user statistics:",
          error
        );
      }
    }
  }

  // Socket.IO setup effect
  useEffect(() => {
    if (
      !assignedCounterId ||
      !assignedCounterService
    )
      return;

    const socket = io();

    // Connect and immediately fetch initial data
    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
      socket.emit(
        "joinCounter",
        assignedCounterId
      );
    });

    // Listen for ticket updates
    socket.on("ticket:update", (ticketData) => {
      console.log(
        "Ticket update received:",
        ticketData
      );

      // Update tickets state directly with the new data
      setTickets((prevTickets) => {
        // Create a copy of the current tickets
        const newTickets = [...prevTickets];

        // Find if this ticket already exists
        const ticketIndex = newTickets.findIndex(
          (t) => t.id === ticketData.id
        );

        // If it exists, update it
        if (ticketIndex > -1) {
          newTickets[ticketIndex] = ticketData;
        }
        // If it's new and belongs to our service, add it
        else if (
          ticketData.serviceId ===
            assignedCounterService &&
          (ticketData.status === "PENDING" ||
            (ticketData.status === "RETURNING" &&
              ticketData.counterId === null))
        ) {
          newTickets.push(ticketData);
        }

        // Sort tickets: prioritized first, then by creation time
        return newTickets.sort((a, b) => {
          if (
            a.isPrioritized === b.isPrioritized
          ) {
            return (
              new Date(a.createdAt).getTime() -
              new Date(b.createdAt).getTime()
            );
          }
          return b.isPrioritized ? 1 : -1;
        });
      });

      // Update other state variables based on ticket status
      if (
        ticketData.counterId === assignedCounterId
      ) {
        if (ticketData.status === "CALLED") {
          setCalledTicketId(ticketData.id);
        } else if (
          ticketData.status === "SERVING"
        ) {
          setServingTicketId(ticketData.id);
        } else if (
          [
            "SERVED",
            "RETURNING",
            "LAPSED",
          ].includes(ticketData.status)
        ) {
          if (calledTicketId === ticketData.id)
            setCalledTicketId(null);
          if (servingTicketId === ticketData.id)
            setServingTicketId(null);
        }
      }
    });

    return () => {
      socket.off("connect");
      socket.off("ticket:update");
      socket.disconnect();
    };
  }, [
    assignedCounterId,
    assignedCounterService,
    calledTicketId,
    servingTicketId,
  ]);

  // Initial data fetch only
  useEffect(() => {
    if (assignedCounterId) {
      fetchTickets();
    }
  }, [assignedCounterId]);

  async function fetchTickets() {
    if (
      !assignedCounterId ||
      !assignedCounterService
    )
      return;

    try {
      // First, get the counter info to reliably determine service type
      const counterRes = await fetch(
        `/api/counter/${assignedCounterId}`
      );
      if (counterRes.ok) {
        const counterData =
          await counterRes.json();
        // Store the service code in state so we can use it throughout the component
        setCounterServiceCode(
          counterData.service?.code || ""
        );
      }

      // Fetch all tickets
      const res = await fetch(
        "/api/tickets/list"
      );
      const allTickets = await res.json();

      // Get tickets assigned to this counter (currently being served or called)
      const assignedToCounter = allTickets.filter(
        (ticket: Ticket) =>
          ticket.counterId === assignedCounterId
      );

      // Get pending tickets for this counter's service that aren't assigned to any counter
      const pendingServiceTickets =
        allTickets.filter(
          (ticket: Ticket) =>
            ticket.status === "PENDING" &&
            ticket.serviceId ===
              assignedCounterService &&
            ticket.counterId === null
        );

      // For non-payment counters, also get returning tickets
      let returningTickets: Ticket[] = [];
      if (counterServiceCode !== "P") {
        // All non-payment counters
        // For returning tickets, we just want to fetch ALL returning tickets
        // that have the same service type as this counter
        const returningRes = await fetch(
          `/api/tickets/list`
        );
        if (returningRes.ok) {
          const allReturnableTickets =
            await returningRes.json();
          // Filter returning tickets for this service at the client side
          returningTickets =
            allReturnableTickets.filter(
              (ticket: Ticket) =>
                ticket.status === "RETURNING" &&
                ticket.serviceId ===
                  assignedCounterService
            );
        }
      }

      // Get tickets being handled by other counters with the same service
      const otherCountersRes = await fetch(
        `/api/tickets/same-service?serviceId=${assignedCounterService}&excludeCounterId=${assignedCounterId}`
      );
      if (otherCountersRes.ok) {
        const otherCounters =
          await otherCountersRes.json();
        setOtherCounterTickets(otherCounters);
      }

      // Rest of the function remains the same...
      const combinedTickets = [
        ...assignedToCounter,
        ...pendingServiceTickets,
        ...returningTickets,
      ];

      // Order tickets: prioritized first, then by creation time
      const sortedTickets = combinedTickets.sort(
        (a: Ticket, b: Ticket) => {
          if (
            a.isPrioritized === b.isPrioritized
          ) {
            return (
              new Date(a.createdAt).getTime() -
              new Date(b.createdAt).getTime()
            );
          }
          return b.isPrioritized ? 1 : -1;
        }
      );

      setTickets(sortedTickets);

      const calledTicket = sortedTickets.find(
        (ticket: Ticket) =>
          ticket.status === "CALLED" &&
          ticket.counterId === assignedCounterId
      );
      setCalledTicketId(
        calledTicket ? calledTicket.id : null
      );

      const servingTicket = sortedTickets.find(
        (ticket: Ticket) =>
          ticket.status === "SERVING" &&
          ticket.counterId === assignedCounterId
      );
      setServingTicketId(
        servingTicket ? servingTicket.id : null
      );
    } catch (error) {
      console.error(
        "Error fetching tickets:",
        error
      );
    }
  }

  // Add function to format average time
  function formatAverageTime(
    seconds: number
  ): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(
      seconds % 60
    );
    return `${minutes}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  }

  // Modify the callNextTicket function to auto-start serving for payment counters
  async function callNextTicket() {
    if (
      !assignedCounterId ||
      !assignedCounterService
    )
      return;

    // First try to find a prioritized pending ticket for this service
    let nextTicket = tickets.find(
      (ticket) =>
        (ticket.status === "PENDING" ||
          ticket.status === "RETURNING") &&
        ticket.isPrioritized &&
        (ticket.serviceId ===
          assignedCounterService ||
          ticket.status === "RETURNING")
    );

    // If no prioritized ticket, get the oldest pending ticket
    if (!nextTicket) {
      nextTicket = tickets.find(
        (ticket) =>
          (ticket.status === "PENDING" ||
            ticket.status === "RETURNING") &&
          (ticket.serviceId ===
            assignedCounterService ||
            ticket.status === "RETURNING")
      );
    }

    if (nextTicket) {
      // For payment counters, start serving immediately
      if (isPaymentCounter) {
        await fetch(
          `/api/tickets/${nextTicket.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: "SERVING",
              counterId: assignedCounterId,
              servingStart: new Date(),
            }),
          }
        );
        setServingTicketId(nextTicket.id);
      } else {
        // For non-payment counters, just call the ticket as before
        await fetch(
          `/api/tickets/${nextTicket.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              status: "CALLED",
              counterId: assignedCounterId,
            }),
          }
        );
        setCalledTicketId(nextTicket.id);
      }
      fetchTickets();
    }
  }

  // Modify markServed to open service type modal first
  function openServiceTypeModal(
    ticketId: string
  ) {
    setTicketToComplete(ticketId);
    setIsServiceTypeModalOpen(true);
  }

  // New function to complete transaction with service type
  function openServiceTypeConfirmation(
    serviceType: ServiceType
  ) {
    if (showConfirmations) {
      setServiceTypeToConfirm(serviceType);
      setIsServiceTypeConfirmModalOpen(true);
      setIsServiceTypeModalOpen(false); // Close the selection modal
    } else {
      // Skip confirmation and complete transaction directly
      if (ticketToComplete) {
        const ticketId = ticketToComplete;

        // Direct completion with the selected service type
        (async () => {
          try {
            const response = await fetch(
              `/api/tickets/${ticketId}`,
              {
                method: "PUT",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                body: JSON.stringify({
                  status: "SERVED",
                  serviceTypeId: serviceType.id,
                  servingEnd: new Date(),
                }),
              }
            );

            if (response.ok) {
              setIsServiceTypeModalOpen(false);
              setTicketToComplete(null);
              setServingTicketId(null);
              setCalledTicketId(null);
              fetchTickets();
              fetchUserStatistics();
            }
          } catch (error) {
            console.error(
              "Error completing transaction:",
              error
            );
          }
        })();
      }
    }
  }

  // New function to actually complete the transaction after confirmation
  async function completeTransaction(
    confirmed: boolean = false
  ) {
    if (
      !confirmed ||
      !ticketToComplete ||
      !serviceTypeToConfirm
    ) {
      // If not confirmed or missing data, just close modals and reset state
      setIsServiceTypeConfirmModalOpen(false);
      setServiceTypeToConfirm(null);
      return;
    }

    try {
      const response = await fetch(
        `/api/tickets/${ticketToComplete}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "SERVED",
            serviceTypeId:
              serviceTypeToConfirm.id,
            servingEnd: new Date(), // Add serving end time
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error(
          "Error completing transaction:",
          errorData
        );
        return;
      }

      // Reset states and refresh data
      setIsServiceTypeConfirmModalOpen(false);
      setServiceTypeToConfirm(null);
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
      console.error(
        "Error completing transaction:",
        error
      );
    }
  }

  async function markServed(ticketId: string) {
    await fetch(`/api/tickets/${ticketId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
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

  // Modify markLapsed to work with the new confirmation modal
  async function markLapsed(ticketId: string) {
    setIsLapsedConfirmModalOpen(false);
    setTicketToLapse(null);

    await fetch(`/api/tickets/${ticketId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "LAPSED" }),
    });
    fetchTickets();
  }

  async function startServing(ticketId: string) {
    await fetch(`/api/tickets/${ticketId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
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
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        status: "CALLED",
        counterId: assignedCounterId,
      }),
    });
    fetchTickets();
  }

  // Modify openTransferModal to just set the ticket ID
  function openTransferModal(ticketId: string) {
    setTicketToTransfer(ticketId);
    setIsTransferModalOpen(true);
  }

  // New function to open transfer confirmation
  function openTransferConfirmation(
    service: Service
  ) {
    if (showConfirmations) {
      setServiceToConfirm(service);
      setIsTransferConfirmModalOpen(true);
      setIsTransferModalOpen(false);
    } else {
      // Skip confirmation and transfer directly
      const ticketId =
        ticketToTransfer ||
        (currentServingTicket
          ? currentServingTicket.id
          : null);

      if (ticketId) {
        // Direct transfer with the selected service
        (async () => {
          try {
            const response = await fetch(
              `/api/tickets/${ticketId}/transfer`,
              {
                method: "PUT",
                headers: {
                  "Content-Type":
                    "application/json",
                },
                body: JSON.stringify({
                  serviceId: service.id,
                }),
              }
            );

            if (response.ok) {
              setIsTransferModalOpen(false);
              setTicketToTransfer(null);
              setServingTicketId(null);
              fetchTickets();
            }
          } catch (error) {
            console.error(
              "Error transferring ticket:",
              error
            );
          }
        })();
      }
    }
  }

  // Modify the openLapsedConfirmModal function
  function openLapsedConfirmModal(
    ticketId: string
  ) {
    if (showConfirmations) {
      setTicketToLapse(ticketId);
      setIsLapsedConfirmModalOpen(true);
    } else {
      // Skip confirmation and mark as lapsed directly
      markLapsed(ticketId);
    }
  }

  // Add this function with your other handler functions
  async function handleTransferTicket(
    confirmed: boolean = false
  ) {
    if (
      !confirmed ||
      !ticketToTransfer ||
      !serviceToConfirm
    ) {
      // If not confirmed or missing data, just close modals and reset state
      setIsTransferConfirmModalOpen(false);
      setServiceToConfirm(null);
      return;
    }

    try {
      const response = await fetch(
        `/api/tickets/${ticketToTransfer}/transfer`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            serviceId: serviceToConfirm.id,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error(
          "Error transferring ticket:",
          errorData
        );
        return;
      }

      // Reset states and refresh data
      setIsTransferConfirmModalOpen(false);
      setServiceToConfirm(null);
      setTicketToTransfer(null);
      setSelectedServiceId("");
      setServingTicketId(null);
      fetchTickets();
    } catch (error) {
      console.error(
        "Error transferring ticket:",
        error
      );
    }
  }

  // Get the counter service code
  const isPaymentCounter =
    counterServiceCode === "P";

  // Update filter for active tickets to exclude called and serving tickets
  const activeTickets = tickets.filter(
    (ticket) =>
      ticket.status !== "LAPSED" &&
      ticket.status !== "CALLED" &&
      ticket.status !== "SERVING" &&
      ticket.status === "PENDING" &&
      ticket.serviceId === assignedCounterService
  );

  const lapsedTickets = tickets.filter(
    (ticket) => ticket.status === "LAPSED"
  );

  // For Customer Welfare and New Service Application, filter returning tickets
  const returningTickets = !isPaymentCounter
    ? tickets.filter(
        (ticket) =>
          ticket.status === "RETURNING" &&
          ticket.serviceId ===
            assignedCounterService
      )
    : [];

  // Disable if a ticket is already in CALLED or SERVING
  const isAnyActive =
    calledTicketId !== null ||
    servingTicketId !== null;

  // Get current serving ticket
  const currentServingTicket = tickets.find(
    (ticket) => ticket.id === servingTicketId
  );

  // Add a new check for pending tickets
  const hasPendingTickets = tickets.some(
    (ticket) =>
      (ticket.status === "PENDING" &&
        ticket.serviceId ===
          assignedCounterService) ||
      (ticket.status === "RETURNING" &&
        !isPaymentCounter)
  );

  // Add the function to handle opening the lapsed confirmation modal
  function openLapsedConfirmModal(
    ticketId: string
  ) {
    setTicketToLapse(ticketId);
    setIsLapsedConfirmModalOpen(true);
  }

  // Add keyboard shortcut handler
  useEffect(() => {
    function handleKeyPress(e: KeyboardEvent) {
      console.log(
        "Key pressed:",
        e.key,
        "Code:",
        e.code
      ); // Debug log

      // Only handle keypresses if no input is focused
      if (
        document.activeElement?.tagName ===
        "INPUT"
      )
        return;

      // Common actions
      if (
        e.key === "n" &&
        !isAnyActive &&
        hasPendingTickets
      ) {
        callNextTicket();
      }

      // Serving ticket actions
      if (currentServingTicket) {
        console.log(
          "Current serving ticket:",
          currentServingTicket
        ); // Debug log

        if (e.key === "c") {
          // Complete action
          if (isPaymentCounter) {
            // Find payment service type and complete automatically
            const paymentType = serviceTypes.find(
              (type) => type.code.startsWith("P-")
            );
            if (paymentType) {
              fetch(
                `/api/tickets/${currentServingTicket.id}`,
                {
                  method: "PUT",
                  headers: {
                    "Content-Type":
                      "application/json",
                  },
                  body: JSON.stringify({
                    status: "SERVED",
                    serviceTypeId: paymentType.id,
                    servingEnd: new Date(),
                  }),
                }
              ).then(() => {
                setServingTicketId(null);
                setCalledTicketId(null);
                fetchTickets();
                fetchUserStatistics();
              });
            }
          } else {
            openServiceTypeModal(
              currentServingTicket.id
            );
          }
        }

        // Transfer shortcuts (1-9 for transfer options)
        if (
          e.code.startsWith("Numpad") ||
          (e.key >= "1" && e.key <= "9")
        ) {
          console.log(
            "Number key detected:",
            e.key,
            e.code
          ); // Debug log
          console.log(
            "Available services:",
            availableServices
          ); // Debug log

          let index: number;
          if (e.code.startsWith("Numpad")) {
            // Extract the number from NumpadX and convert to zero-based index
            const numpadNum = parseInt(
              e.code.replace("Numpad", "")
            );
            console.log(
              "Numpad number:",
              numpadNum
            ); // Debug log
            if (
              !isNaN(numpadNum) &&
              numpadNum >= 1 &&
              numpadNum <= 9
            ) {
              index = numpadNum - 1;
            } else {
              return; // Invalid numpad key
            }
          } else {
            // Regular number key
            index = parseInt(e.key) - 1;
          }

          console.log("Calculated index:", index); // Debug log

          if (
            index >= 0 &&
            index < availableServices.length
          ) {
            const service =
              availableServices[index];
            console.log(
              "Service found at index:",
              service
            ); // Debug log

            if (showConfirmations) {
              openTransferConfirmation(service);
            } else {
              // Find and click the transfer button for this service
              const transferButtons =
                document.querySelectorAll(
                  "button"
                );
              const targetButton = Array.from(
                transferButtons
              ).find((button) =>
                button.textContent?.includes(
                  `Transfer to ${service.name}`
                )
              );

              if (targetButton) {
                console.log(
                  "Found transfer button, clicking..."
                );
                targetButton.click();
              } else {
                console.log(
                  "Transfer button not found"
                );
              }
            }
          }
        }

        if (e.key === "x") {
          // Cancel action
          fetch(
            `/api/tickets/${currentServingTicket.id}`,
            {
              method: "PUT",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                status: "CANCELLED",
              }),
            }
          ).then(() => {
            setServingTicketId(null);
            fetchTickets();
          });
        }
      }

      // Called ticket actions
      if (calledTicketId) {
        const calledTicket = tickets.find(
          (t) => t.id === calledTicketId
        );
        if (calledTicket) {
          if (e.key === "s") {
            startServing(calledTicket.id);
          }
          if (
            e.key === "l" &&
            !isPaymentCounter
          ) {
            openLapsedConfirmModal(
              calledTicket.id
            );
          }
        }
      }
    }

    window.addEventListener(
      "keydown",
      handleKeyPress
    );
    return () =>
      window.removeEventListener(
        "keydown",
        handleKeyPress
      );
  }, [
    currentServingTicket,
    calledTicketId,
    isPaymentCounter,
    availableServices,
    hasPendingTickets,
    isAnyActive,
    serviceTypes,
    showConfirmations,
  ]);

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
            You are not assigned to any counter.
            Please contact an administrator.
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
            <Image
              src="/wdlogo.png"
              alt="WD Logo"
              width={120}
              height={120}
            />

            <div>
              <h1 className="text-3xl font-bold text-sky-800 mb-2">
                {session?.user
                  ?.assignedCounterName ||
                  `Counter ID: ${assignedCounterId}`}
              </h1>
              {/* <h2 className="text-xl font-medium text-sky-600">
                {session?.user?.assignedCounterName ||
                  `Counter ID: ${assignedCounterId}`}
              </h2> */}
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
                className="flex items-center cursor-pointer"
              >
                <div className="bg-sky-600 text-white rounded-full w-20 h-20 flex items-center justify-center font-bold text-lg mr-3">
                  {getInitials(
                    session.user.name || ""
                  )}
                </div>
                <span className="text-sky-800 font-extrabold">
                  {session.user.name ||
                    "Staff User"}
                </span>
              </button>

              {/* Profile Menu Dropdown */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 top-24 w-64 bg-white rounded-lg shadow-xl border border-gray-100 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        Always Confirm
                      </span>
                      <button
                        onClick={() => {
                          const newValue =
                            !showConfirmations;
                          setShowConfirmations(
                            newValue
                          );
                          localStorage.setItem(
                            "showConfirmations",
                            String(newValue)
                          );
                        }}
                        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${
                          showConfirmations
                            ? "bg-sky-600"
                            : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`inline-block w-4 h-4 transform transition-transform bg-white rounded-full ${
                            showConfirmations
                              ? "translate-x-6"
                              : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {showConfirmations
                        ? "Confirmation dialogs will be shown before actions"
                        : "Actions will be performed without confirmation"}
                    </p>
                  </div>
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
        {/* Left sidebar - Currently Serving section only */}
        <div className="lg:w-auto">
          {/* Current serving ticket card */}
          <div className="bg-white rounded-2xl shadow-2xl p-8 h-[650px] w-[570px]">
            <h2 className="text-2xl font-bold text-sky-800 mb-6 text-center">
              Currently Serving
            </h2>
            <div className="h-[520px] flex items-center justify-center">
              {currentServingTicket ? (
                <div className="flex flex-col items-center w-full">
                  <div className="bg-sky-100 rounded-lg w-[500px] h-[100px] flex items-center justify-center mb-1">
                    <span
                      className={`${getTicketTextSizeClass(
                        currentServingTicket
                      )} font-bold text-sky-700 text-center px-2 break-all`}
                    >
                      {currentServingTicket.isPrioritized
                        ? "PWD-"
                        : ""}
                      {getTicketDisplayCode(
                        currentServingTicket
                      )}
                      -
                      {formatTicketNumber(
                        currentServingTicket.ticketNumber
                      )}
                    </span>
                  </div>
                  <p className="text-xl font-medium text-sky-600 mb-2">
                    {currentServingTicket.service
                      ?.name || "Unknown Service"}
                  </p>
                  {currentServingTicket.isPrioritized && (
                    <span className="bg-amber-100 text-amber-800 text-base px-3 py-1 rounded-full font-medium mb-1">
                      Priority
                    </span>
                  )}
                  <div className="mt-1 w-full">
                    <p className="text-lg text-gray-500 text-center mb-2">
                      Transaction Time
                    </p>
                    <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center">
                      <div className="text-4xl font-mono font-bold text-sky-800">
                        {formattedTime}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 w-full space-y-3">
                    {isPaymentCounter ? (
                      <>
                        {/* For Payment Counter - Complete button */}
                        <button
                          onClick={async () => {
                            try {
                              // Find payment service type and complete with it automatically
                              const paymentType =
                                serviceTypes.find(
                                  (type) =>
                                    type.code.startsWith(
                                      "P-"
                                    )
                                );

                              if (paymentType) {
                                const response =
                                  await fetch(
                                    `/api/tickets/${currentServingTicket.id}`,
                                    {
                                      method:
                                        "PUT",
                                      headers: {
                                        "Content-Type":
                                          "application/json",
                                      },
                                      body: JSON.stringify(
                                        {
                                          status:
                                            "SERVED",
                                          serviceTypeId:
                                            paymentType.id,
                                          servingEnd:
                                            new Date(),
                                        }
                                      ),
                                    }
                                  );

                                if (response.ok) {
                                  setServingTicketId(
                                    null
                                  );
                                  setCalledTicketId(
                                    null
                                  );
                                  fetchTickets();
                                  fetchUserStatistics();
                                }
                              }
                            } catch (error) {
                              console.error(
                                "Error completing payment:",
                                error
                              );
                            }
                          }}
                          className="w-full bg-green-500 hover:bg-green-600 text-white font-medium text-xl py-4 px-6 rounded-lg transition-colors relative"
                        >
                          Complete Payment
                          <span className="absolute top-0 right-0 bg-green-700 text-xs px-2 py-1 rounded-tr-lg rounded-bl-lg">
                            C
                          </span>
                        </button>

                        {/* Transfers - Direct buttons instead of modal */}
                        <div className="grid grid-cols-1 gap-2">
                          {availableServices.map(
                            (service, index) => (
                              <button
                                key={service.id}
                                onClick={async () => {
                                  try {
                                    const response =
                                      await fetch(
                                        `/api/tickets/${currentServingTicket.id}/transfer`,
                                        {
                                          method:
                                            "PUT",
                                          headers:
                                            {
                                              "Content-Type":
                                                "application/json",
                                            },
                                          body: JSON.stringify(
                                            {
                                              serviceId:
                                                service.id,
                                            }
                                          ),
                                        }
                                      );

                                    if (
                                      response.ok
                                    ) {
                                      setServingTicketId(
                                        null
                                      );
                                      fetchTickets();
                                    }
                                  } catch (error) {
                                    console.error(
                                      "Error transferring ticket:",
                                      error
                                    );
                                  }
                                }}
                                className="w-full bg-purple-500 hover:bg-purple-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center relative"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-5 w-5 mr-2"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8z" />
                                  <path d="M12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z" />
                                </svg>
                                Transfer to{" "}
                                {service.name}
                                {/* <span className="absolute top-0 right-0 bg-purple-700 text-xs px-2 py-1 rounded-tr-lg rounded-bl-lg">
                                {index + 1}
                              </span> */}
                              </button>
                            )
                          )}
                        </div>

                        {/* Cancel button */}
                        {/* <button
                          onClick={async () => {
                            try {
                              const response = await fetch(
                                `/api/tickets/${currentServingTicket.id}`,
                                {
                                  method: "PUT",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    status: "CANCELLED", // Changed from LAPSED to CANCELLED
                                  }),
                                }
                              );

                              if (response.ok) {
                                setServingTicketId(null);
                                fetchTickets();
                              }
                            } catch (error) {
                              console.error("Error cancelling ticket:", error);
                            }
                          }}
                          className="w-full bg-red-500 hover:bg-red-600 text-white font-medium text-xl py-4 px-6 rounded-lg transition-colors relative"
                        >
                          Cancel Transaction
                          <span className="absolute top-0 right-0 bg-red-700 text-xs px-2 py-1 rounded-tr-lg rounded-bl-lg">
                            X
                          </span>
                        </button> */}
                        <Button
                          onClick={async () => {
                            try {
                              const response =
                                await fetch(
                                  `/api/tickets/${currentServingTicket.id}`,
                                  {
                                    method: "PUT",
                                    headers: {
                                      "Content-Type":
                                        "application/json",
                                    },
                                    body: JSON.stringify(
                                      {
                                        status:
                                          "CANCELLED", // Changed from LAPSED to CANCELLED
                                      }
                                    ),
                                  }
                                );

                              if (response.ok) {
                                setServingTicketId(
                                  null
                                );
                                fetchTickets();
                              }
                            } catch (error) {
                              console.error(
                                "Error cancelling ticket:",
                                error
                              );
                            }
                          }}
                        >
                          Cancel Transaction 1
                          <span className="absolute top-0 right-0 bg-red-700 text-xs px-2 py-1 rounded-tr-lg rounded-bl-lg">
                            X
                          </span>
                        </Button>
                      </>
                    ) : (
                      // For non-payment counters - Keep original button
                      <button
                        onClick={() =>
                          openServiceTypeModal(
                            currentServingTicket.id
                          )
                        }
                        className="w-full bg-green-500 hover:bg-green-600 text-white font-medium text-xl py-4 px-6 rounded-lg transition-colors relative"
                      >
                        Complete Transaction
                        <span className="absolute top-0 right-0 bg-green-700 text-xs px-2 py-1 rounded-tr-lg rounded-bl-lg">
                          C
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              ) : calledTicketId ? (
                <div className="flex flex-col items-center w-full">
                  {tickets
                    .filter(
                      (t) =>
                        t.id === calledTicketId
                    )
                    .map((ticket) => (
                      <div
                        key={ticket.id}
                        className="flex flex-col items-center w-full"
                      >
                        <div className="bg-amber-100 rounded-lg w-[500px] h-[100px] flex items-center justify-center mb-6 shadow-md">
                          <span
                            className={`${getTicketTextSizeClass(
                              ticket
                            )} font-bold text-amber-700 text-center px-2 break-all`}
                          >
                            {ticket.isPrioritized
                              ? "PWD-"
                              : ""}
                            {getTicketDisplayCode(
                              ticket
                            )}
                            -
                            {formatTicketNumber(
                              ticket.ticketNumber
                            )}
                          </span>
                        </div>
                        <p className="text-xl font-medium text-amber-600 mb-2">
                          {ticket.service?.name ||
                            "Unknown Service"}
                        </p>
                        {ticket.isPrioritized && (
                          <span className="bg-amber-100 text-amber-800 text-base px-3 py-1 rounded-full font-medium mb-4">
                            Priority
                          </span>
                        )}
                        <p className="text-center text-amber-600 mb-4 animate-pulse font-medium text-2xl">
                          Ticket Called
                        </p>
                        <div className="mt-6 w-full space-y-4">
                          {isPaymentCounter ? (
                            // For payment counter, we show Start Serving button which works the same
                            // as the regular Start Serving button but without confirmation dialog
                            <button
                              onClick={() =>
                                startServing(
                                  ticket.id
                                )
                              }
                              className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-4 px-6 text-xl rounded-lg transition-all flex items-center justify-center"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-7 w-7 mr-3"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path d="M8 7h4v10H8z" />
                                <path d="M6 7H2v10h4z" />
                                <path d="M18 7h-4v10h4z" />
                              </svg>
                              Start Payment
                              Process
                            </button>
                          ) : (
                            // For non-payment counters, keep original buttons
                            <>
                              <button
                                onClick={() => {
                                  const btn =
                                    document.activeElement as HTMLButtonElement;
                                  btn?.classList.add(
                                    "scale-95",
                                    "opacity-80"
                                  );
                                  setTimeout(
                                    () => {
                                      btn?.classList.remove(
                                        "scale-95",
                                        "opacity-80"
                                      );
                                      startServing(
                                        ticket.id
                                      );
                                    },
                                    150
                                  );
                                }}
                                className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-4 px-6 text-xl rounded-lg transition-all transform active:scale-95 active:bg-green-700 flex items-center justify-center relative"
                                title="Press 'S' to start serving"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-7 w-7 mr-3"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                Start Serving
                                <span className="absolute top-0 right-0 bg-green-700 text-xs px-2 py-1 rounded-tr-lg rounded-bl-lg">
                                  S
                                </span>
                              </button>
                              <button
                                onClick={() =>
                                  openLapsedConfirmModal(
                                    ticket.id
                                  )
                                }
                                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-4 px-6 text-xl rounded-lg transition-all transform active:scale-95 active:bg-amber-700 flex items-center justify-center relative"
                                title="Press 'L' to mark as lapsed"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-7 w-7 mr-3"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                Mark as Lapsed
                                <span className="absolute top-0 right-0 bg-amber-700 text-xs px-2 py-1 rounded-tr-lg rounded-bl-lg">
                                  L
                                </span>
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              ) : lapsedTickets.length > 0 ||
                returningTickets.length > 0 ? (
                <div className="flex flex-col items-center w-full">
                  <p className="text-center text-sky-700 mb-4">
                    Available Actions
                  </p>

                  {lapsedTickets.length > 0 && (
                    <div className="w-full mb-3">
                      <h3 className="text-sm font-medium text-amber-700 mb-2">
                        Lapsed Tickets
                      </h3>
                      {lapsedTickets.map(
                        (ticket) => (
                          <div
                            key={ticket.id}
                            className="bg-amber-50 p-2 rounded-lg mb-2 flex justify-between items-center"
                          >
                            <span>
                              {ticket.isPrioritized
                                ? "PWD-"
                                : ""}
                              {getTicketDisplayCode(
                                ticket
                              )}
                              -
                              {formatTicketNumber(
                                ticket.ticketNumber
                              )}
                            </span>
                            <button
                              onClick={() =>
                                recallTicket(
                                  ticket.id
                                )
                              }
                              className="bg-amber-500 hover:bg-amber-600 text-white font-medium py-1 px-3 rounded text-sm transition-colors"
                            >
                              Recall
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {returningTickets.length >
                    0 && (
                    <div className="w-full mb-4">
                      <h3 className="text-sm font-medium text-purple-700 mb-2">
                        Returning Tickets
                      </h3>
                      {returningTickets.map(
                        (ticket) => (
                          <div
                            key={ticket.id}
                            className="bg-purple-50 p-2 rounded-lg mb-2 flex justify-between items-center hover:bg-purple-100 transition-colors border border-purple-100"
                          >
                            <span className="font-medium">
                              {ticket.isPrioritized
                                ? "PWD-"
                                : ""}
                              {getTicketDisplayCode(
                                ticket
                              )}
                              -
                              {formatTicketNumber(
                                ticket.ticketNumber
                              )}
                            </span>
                            <button
                              onClick={(e) => {
                                const btn =
                                  e.currentTarget;
                                btn.classList.add(
                                  "scale-95"
                                );
                                btn.innerText =
                                  "Calling...";
                                setTimeout(() => {
                                  recallTicket(
                                    ticket.id
                                  );
                                }, 200);
                              }}
                              className="bg-purple-500 hover:bg-purple-600 text-white font-medium py-1 px-3 rounded text-sm transition-all transform active:scale-95 active:bg-purple-700 flex items-center"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 mr-1"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                              </svg>
                              Call
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  )}

                  {/* Call Next Ticket button at the bottom */}
                  <div className="w-full mt-3 pt-3 border-t border-gray-100">
                    {/* Call Next Button */}
                    <button
                      onClick={(e) => {
                        if (!hasPendingTickets)
                          return;
                        const btn =
                          e.currentTarget;
                        btn.innerText =
                          "Calling...";
                        btn.classList.add(
                          "scale-95",
                          "bg-sky-700"
                        );
                        btn.disabled = true;
                        setTimeout(() => {
                          callNextTicket();
                          // Button will be unmounted/remounted when state changes
                        }, 300);
                      }}
                      disabled={
                        !hasPendingTickets
                      }
                      className={`w-full py-3 px-4 rounded-lg transition-all transform flex items-center justify-center font-medium relative ${
                        hasPendingTickets
                          ? "bg-sky-500 hover:bg-sky-600 text-white active:scale-95"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                      title="Press 'N' to call next ticket"
                    >
                      {hasPendingTickets && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                        </svg>
                      )}
                      Call Next Ticket
                      <span className="absolute top-0 right-0 bg-sky-700 text-xs px-2 py-1 rounded-tr-lg rounded-bl-lg">
                        N
                      </span>
                    </button>
                    {!hasPendingTickets && (
                      <p className="text-xs text-gray-500 text-center mt-1">
                        No pending tickets in
                        queue
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center w-full">
                  <p className="text-center text-gray-500 mb-6">
                    No ticket currently being
                    served
                  </p>
                  <button
                    onClick={(e) => {
                      if (!hasPendingTickets)
                        return;
                      const btn = e.currentTarget;
                      btn.innerText =
                        "Calling...";
                      btn.classList.add(
                        "scale-95",
                        "bg-sky-700"
                      );
                      btn.disabled = true;
                      setTimeout(() => {
                        callNextTicket();
                      }, 300);
                    }}
                    disabled={!hasPendingTickets}
                    className={`w-full py-3 px-4 rounded-lg transition-all transform flex items-center justify-center font-medium ${
                      hasPendingTickets
                        ? "bg-sky-500 hover:bg-sky-600 text-white active:scale-95"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                  >
                    {hasPendingTickets && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                      </svg>
                    )}
                    Call Next Ticket
                    <span className="absolute top-0 right-0 bg-sky-700 text-xs px-2 py-1 rounded-tr-lg rounded-bl-lg">
                      N
                    </span>
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
        </div>

        {/* Main content area - EXPANDED */}
        <div className="flex-1 space-y-6">
          {/* Active and Lapsed Tickets side by side */}
          <div className="flex flex-col md:flex-row gap-6">
            {/* Active Tickets - NOW LEFT SIDE */}
            <div
              className={`bg-white rounded-2xl shadow-lg p-8 ${
                isPaymentCounter
                  ? "w-full"
                  : "flex-1"
              } min-h-[475px]`}
            >
              <h2 className="text-3xl font-bold text-sky-800 mb-6">
                Next in Line
              </h2>
              <div className="h-[290px] flex items-center justify-center">
                {activeTickets.length ? (
                  <div className="flex flex-col items-center">
                    {/* Display just the first waiting ticket - RESPONSIVE SIZE */}
                    <div className="bg-sky-50 rounded-lg w-[500px] h-[200px] flex items-center justify-center mb-6">
                      <span
                        className={`${getTicketTextSizeClass(
                          activeTickets[0]
                        )} font-bold text-sky-700 text-center px-2 break-all`}
                      >
                        {activeTickets[0]
                          .isPrioritized
                          ? "PWD-"
                          : ""}
                        {getTicketDisplayCode(
                          activeTickets[0]
                        )}
                        -
                        {formatTicketNumber(
                          activeTickets[0]
                            .ticketNumber
                        )}
                      </span>
                    </div>
                    <p className="text-xl font-medium text-sky-600 mb-2">
                      {activeTickets[0].service
                        ?.name ||
                        "Unknown Service"}
                    </p>
                    {activeTickets[0]
                      .isPrioritized && (
                      <span className="bg-amber-100 text-amber-800 text-base px-3 py-1 rounded-full font-medium mb-3">
                        Priority
                      </span>
                    )}
                    <p className="text-lg text-sky-600 mt-2">
                      Status: Waiting
                    </p>

                    {/* Show pending count if there are more waiting tickets */}
                    {activeTickets.length > 1 && (
                      <div className="mt-6 bg-sky-50 border border-sky-100 rounded-lg py-3 px-6">
                        <p className="text-center text-sky-700 font-medium text-xl">
                          Waiting:{" "}
                          {activeTickets.length -
                            1}{" "}
                          ticket
                          {activeTickets.length -
                            1 !==
                          1
                            ? "s"
                            : ""}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center">
                    <p className="text-center text-sky-600 text-xl">
                      No tickets waiting in queue
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Lapsed Tickets Section - NOW RIGHT SIDE - Only show for non-payment counters */}
            {!isPaymentCounter && (
              <div className="bg-white rounded-2xl shadow-lg p-6 flex-1 min-h-[400px]">
                <h2 className="text-2xl font-bold text-sky-800 mb-4">
                  Lapsed Tickets
                </h2>
                <div className="h-[220px] overflow-auto">
                  {lapsedTickets.length ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {lapsedTickets.map(
                        (ticket) => (
                          <div
                            key={ticket.id}
                            className="border border-amber-100 rounded-lg p-4 bg-amber-50"
                          >
                            <p className="font-medium text-amber-700">
                              {ticket.isPrioritized
                                ? "PWD-"
                                : ""}
                              {getTicketDisplayCode(
                                ticket
                              )}
                              -
                              {formatTicketNumber(
                                ticket.ticketNumber
                              )}
                            </p>
                            <p className="text-xs text-amber-600 mt-1">
                              Status:{" "}
                              {ticket.status}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className="text-center text-amber-600">
                        No lapsed tickets.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Returning Tickets Section - EXPANDED GRID */}
          {!isPaymentCounter && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-sky-800 mb-4">
                Returning Tickets
              </h2>
              {returningTickets.length ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {returningTickets.map(
                    (ticket) => (
                      <div
                        key={ticket.id}
                        className="border border-purple-100 rounded-lg p-4 bg-purple-50"
                      >
                        <p className="font-medium text-purple-700">
                          {ticket.isPrioritized
                            ? "PWD-"
                            : ""}
                          {getTicketDisplayCode(
                            ticket
                          )}
                          -
                          {formatTicketNumber(
                            ticket.ticketNumber
                          )}
                        </p>
                        <p className="text-xs text-purple-600 mt-1">
                          Status: {ticket.status}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Transferred from Payment
                        </p>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="text-center text-purple-600">
                  No returning tickets.
                </p>
              )}
            </div>
          )}

          {/* Other Counters Status - EXPANDED GRID */}
          {/* <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-sky-800 mb-4">
              Other Counters
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
                          {getTicketDisplayCode(counter.ticket)}-
                          {formatTicketNumber(counter.ticket.ticketNumber)}
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
          </div> */}
        </div>

        {/* User Statistics Card - MOVED TO RIGHT SIDE */}
        <div className="lg:w-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8 h-fit">
            <h2 className="text-2xl font-bold text-sky-800 mb-6 text-center">
              Your Statistics
            </h2>
            <div className="space-y-6">
              <div className="bg-sky-50 rounded-lg p-5">
                <p className="text-lg text-sky-700 font-medium">
                  Total Served
                </p>
                <p className="text-3xl font-bold text-sky-800">
                  {userStats.totalServed}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-5">
                <p className="text-lg text-green-700 font-medium">
                  Today
                </p>
                <p className="text-3xl font-bold text-green-800">
                  {userStats.todayServed}
                </p>
              </div>
              <div className="bg-amber-50 rounded-lg p-5">
                <p className="text-lg text-amber-700 font-medium">
                  Avg. Service Time
                </p>
                <p className="text-3xl font-bold text-amber-800">
                  {formatAverageTime(
                    userStats.averageServiceTime
                  )}
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
            <h3 className="text-lg font-semibold mb-4">
              Transfer Ticket
            </h3>
            <div className="mb-6">
              <p className="block text-sm font-medium text-gray-700 mb-3">
                Select Destination Service
              </p>
              <div className="space-y-2">
                {availableServices.map(
                  (service) => (
                    <button
                      key={service.id}
                      onClick={() =>
                        openTransferConfirmation(
                          service
                        )
                      }
                      className="w-full bg-sky-500 hover:bg-sky-600 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-between"
                    >
                      <span>{service.name}</span>
                      <span className="text-xs bg-sky-700 px-2 py-1 rounded">
                        {service.code}
                      </span>
                    </button>
                  )
                )}
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

      {/* Add Transfer Confirmation Modal */}
      {isTransferConfirmModalOpen &&
        serviceToConfirm &&
        ticketToTransfer && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 w-[500px] shadow-2xl transform transition-all animate-fade-in-down">
              <div className="flex items-center mb-6 text-purple-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mr-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <h3 className="text-2xl font-bold text-gray-800">
                  Confirm Transfer
                </h3>
              </div>

              <div className="mb-8">
                <p className="text-lg text-gray-700 mb-6">
                  Are you sure you want to
                  transfer this ticket to the
                  following service?
                </p>

                <div className="bg-purple-50 border border-purple-100 rounded-lg p-5 mb-6">
                  <div className="text-center">
                    <span className="text-3xl font-bold text-purple-700 block">
                      {serviceToConfirm.name}
                    </span>
                    <span className="text-xl text-purple-600 block mt-2">
                      Code:{" "}
                      {serviceToConfirm.code}
                    </span>
                  </div>
                </div>

                <div className="bg-sky-50 border border-sky-100 rounded-lg p-5">
                  {tickets
                    .filter(
                      (t) =>
                        t.id === ticketToTransfer
                    )
                    .map((ticket) => (
                      <div
                        key={ticket.id}
                        className="text-center"
                      >
                        <span className="text-2xl font-bold text-sky-700 block">
                          Current Ticket:
                        </span>
                        <span className="text-xl font-bold text-sky-700 block mt-2">
                          {ticket.isPrioritized
                            ? "PWD-"
                            : ""}
                          {getTicketDisplayCode(
                            ticket
                          )}
                          -
                          {formatTicketNumber(
                            ticket.ticketNumber
                          )}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setIsTransferConfirmModalOpen(
                      false
                    );
                    setServiceToConfirm(null);
                    setIsTransferModalOpen(true); // Reopen the selection modal
                  }}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-md transition-colors text-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    handleTransferTicket(true)
                  }
                  className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white font-medium rounded-md transition-colors flex items-center text-lg"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L10 8.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Transfer Ticket
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Add Service Type Modal */}
      {isServiceTypeModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[600px] max-h-[80vh] overflow-auto shadow-2xl">
            <h3 className="text-xl font-semibold mb-4">
              Select Service Type
            </h3>

            {/* Search bar */}
            <div className="mb-4 relative">
              <input
                type="text"
                placeholder="Search service types..."
                value={serviceTypeSearchQuery}
                onChange={(e) =>
                  setServiceTypeSearchQuery(
                    e.target.value
                  )
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <div className="absolute right-3 top-2.5 text-gray-400">
                <svg
                  xmlns="http://wwww3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            </div>

            <div className="mb-6">
              <p className="block text-sm font-medium text-gray-700 mb-3">
                Choose the type of service
                provided
              </p>

              {/* Grid layout for service types */}
              <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto pr-2">
                {serviceTypes
                  .filter(
                    (type) =>
                      type.name
                        .toLowerCase()
                        .includes(
                          serviceTypeSearchQuery.toLowerCase()
                        ) ||
                      type.code.toLowerCase.includes(
                        serviceTypeSearchQuery.toLowerCase()
                      )
                  )
                  .map((type) => (
                    <button
                      key={type.id}
                      onClick={() =>
                        openServiceTypeConfirmation(
                          type
                        )
                      }
                      className="bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-800 font-medium py-3 px-4 rounded-lg transition-colors flex flex-col items-start"
                    >
                      <span className="font-semiboldtext-sky-900 mb-1">
                        {type.name}
                      </span>
                      <span className="text-xs bg-sky-600 text-white px-2 py-0.5 rounded">
                        {type.code}
                      </span>
                    </button>
                  ))}
              </div>

              {serviceTypes.filter(
                (type) =>
                  type.name
                    .toLowerCase()
                    .includes(
                      serviceTypeSearchQuery.toLowerCase()
                    ) ||
                  type.code
                    .toLowerCase()
                    .includes(
                      serviceTypeSearchQuery.toLowerCase()
                    )
              ).length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  No matching service types found
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => {
                  setIsServiceTypeModalOpen(
                    false
                  );
                  setTicketToComplete(null);
                  setSelectedServiceTypeId("");
                  setServiceTypeSearchQuery(""); // Clear search when closing modal
                }}
                className="px-4 py-2 bg-gray-200 rounded-md text-gray-700 hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add new Lapsed Confirmation Modal */}
      {isLapsedConfirmModalOpen &&
        ticketToLapse && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 w-[500px] shadow-2xl transform transition-all animate-fade-in-down">
              <div className="flex items-center mb-6 text-amber-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mr-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <h3 className="text-2xl font-bold text-gray-800">
                  Confirm Action
                </h3>
              </div>

              <div className="mb-8">
                <p className="text-lg text-gray-700 mb-6">
                  Are you sure you want to mark
                  this ticket as lapsed? This
                  action indicates the customer
                  did not respond when called.
                </p>

                <div className="bg-amber-50 border border-amber-100 rounded-lg p-5 mb-6">
                  {tickets
                    .filter(
                      (t) =>
                        t.id === ticketToLapse
                    )
                    .map((ticket) => (
                      <div
                        key={ticket.id}
                        className="text-center"
                      >
                        <span className="text-3xl font-bold text-amber-700 block">
                          {ticket.isPrioritized
                            ? "PWD-"
                            : ""}
                          {getTicketDisplayCode(
                            ticket
                          )}
                          -
                          {formatTicketNumber(
                            ticket.ticketNumber
                          )}
                        </span>
                        <span className="text-xl text-amber-600 block mt-2">
                          {ticket.service?.name}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setIsLapsedConfirmModalOpen(
                      false
                    );
                    setTicketToLapse(null);
                  }}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-md transition-colors text-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const ticketId =
                      ticketToLapse;
                    if (ticketId) {
                      markLapsed(ticketId);
                    }
                  }}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-md transition-colors flex items-center text-lg"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a11 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L10 8.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Add Service Type Confirmation Modal */}
      {isServiceTypeConfirmModalOpen &&
        serviceTypeToConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 w-[500px] shadow-2xl transform transition-all animate-fade-in-down">
              <div className="flex items-center mb-6 text-green-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mr-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <h3 className="text-2xl font-bold text-gray-800">
                  Confirm Service Type
                </h3>
              </div>

              <div className="mb-8">
                <p className="text-lg text-gray-700 mb-6">
                  Are you sure you want to
                  complete this transaction with
                  the following service type?
                </p>

                <div className="bg-green-50 border border-green-100 rounded-lg p-5 mb-6">
                  <div className="text-center">
                    <span className="text-3xl font-bold text-green-700 block">
                      {serviceTypeToConfirm.name}
                    </span>
                    <span className="text-xl text-green-600 block mt-2">
                      Code:{" "}
                      {serviceTypeToConfirm.code}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setIsServiceTypeConfirmModalOpen(
                      false
                    );
                    setServiceTypeToConfirm(null);
                    setIsServiceTypeModalOpen(
                      true
                    ); // Reopen the selection modal
                  }}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium rounded-md transition-colors text-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    completeTransaction(true)
                  }
                  className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-md transition-colors flex items-center text-lg"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L10 8.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Complete Transaction
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}
