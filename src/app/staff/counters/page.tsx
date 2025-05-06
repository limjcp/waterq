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

  const [
    serviceTypeRemarks,
    setServiceTypeRemarks,
  ] = useState<string>("");

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

  // Add these new state variables near the other state declarations
  const [
    isLapsedListModalOpen,
    setIsLapsedListModalOpen,
  ] = useState(false);
  const [
    isReturningListModalOpen,
    setIsReturningListModalOpen,
  ] = useState(false);

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
  useEffect(() => {
    // Create a bell sound instance that can be reused
    const bell = new Audio("/bell.mp3");
    bell.volume = 1.0;
    bell.preload = "auto";

    // Add event listeners for debugging
    bell.addEventListener("error", (e) => {
      console.error(
        "Error loading bell sound:",
        e
      );
    });

    bell.addEventListener(
      "canplaythrough",
      () => {
        console.log(
          "Bell sound successfully loaded and can play"
        );
      }
    );

    // Store in a ref so it can be accessed by the ringBell function
    window.bellSound = bell;

    return () => {
      // Clean up event listeners
      bell.removeEventListener("error", () => {});
      bell.removeEventListener(
        "canplaythrough",
        () => {}
      );
    };
  }, []);

  // Then update the ringBell function to use this bell sound:
  async function ringBell() {
    if (!assignedCounterId) return;

    try {
      // Use a persistent socket connection rather than creating a new one each time
      if (!window.bellSocket) {
        window.bellSocket = io();
        console.log(
          "Created persistent bell socket"
        );
      }

      // Check if socket is connected, reconnect if needed
      if (!window.bellSocket.connected) {
        console.log(
          "Reconnecting bell socket..."
        );
        window.bellSocket.connect();
      }

      // Emit the event
      window.bellSocket.emit("ring:bell", {
        counterId: assignedCounterId,
      });

      // Also play the sound locally for immediate feedback
      if (window.bellSound) {
        window.bellSound.currentTime = 0;
        window.bellSound
          .play()
          .catch((err) =>
            console.error(
              "Error playing local bell sound:",
              err
            )
          );
      }

      console.log(
        "%c BELL RING SENT 🔔",
        "background: #FFD700; color: #000; font-weight: bold; padding: 4px;"
      );
    } catch (error) {
      console.error("Error ringing bell:", error);
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

      // Show all lapsed tickets for this service, regardless of counter assignment
      const lapsedServiceTickets =
        allTickets.filter(
          (ticket: Ticket) =>
            ticket.status === "LAPSED" &&
            ticket.serviceId ===
              assignedCounterService
        );

      // Get tickets being handled by other counters with the same service
      const otherCountersRes = await fetch(
        `/api/tickets/same-service?serviceId=${assignedCounterService}&excludeCounterId=${assignedCounterId}`
      );
      if (otherCountersRes.ok) {
        const otherCounters =
          await otherCountersRes.json();
        setOtherCounterTickets(otherCounters);
      } // Rest of the function remains the same...
      // Remove duplicate tickets by creating a Map with ticket ID as key
      const ticketMap = new Map();

      // Combine all tickets, giving priority to the most recent version of each ticket
      [
        ...assignedToCounter,
        ...pendingServiceTickets,
        ...returningTickets,
        ...lapsedServiceTickets,
      ].forEach((ticket) => {
        ticketMap.set(ticket.id, ticket);
      });

      // Convert the Map back to an array
      const combinedTickets = Array.from(
        ticketMap.values()
      );

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
    serviceType: ServiceType,
    remarks: string = ""
  ) {
    if (showConfirmations) {
      setServiceTypeToConfirm(serviceType);
      setServiceTypeRemarks(remarks);
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
                  remarks: remarks.trim() || null, // Include remarks if present
                }),
              }
            );

            if (response.ok) {
              setIsServiceTypeModalOpen(false);
              setTicketToComplete(null);
              setSelectedServiceTypeId("");
              setServiceTypeRemarks("");
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
            remarks:
              serviceTypeRemarks.trim() || null, // Include remarks if present
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
      setServiceTypeRemarks("");
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

    try {
      const response = await fetch(
        `/api/tickets/${ticketId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "LAPSED",
            servingEnd: new Date(), // Add end time for the lapsed ticket
          }),
        }
      );

      if (response.ok) {
        setCalledTicketId(null); // Clear the called ticket state
        fetchTickets();
      }
    } catch (error) {
      console.error(
        "Error marking ticket as lapsed:",
        error
      );
    }
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

    try {
      const response = await fetch(
        `/api/tickets/${ticketId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "CALLED",
            counterId: assignedCounterId, // This assigns the ticket to the counter that's recalling it
          }),
        }
      );

      if (response.ok) {
        console.log(
          `Ticket ${ticketId} recalled to counter ${assignedCounterId}`
        );
        fetchTickets(); // Refresh the tickets list
      } else {
        console.error(
          "Error recalling ticket:",
          await response.json()
        );
      }
    } catch (error) {
      console.error(
        "Error recalling ticket:",
        error
      );
    }
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
      (ticket.status === "PENDING" ||
        ticket.status === "RETURNING") &&
      ticket.serviceId === assignedCounterService
  );

  // Show all lapsed tickets for this service, regardless of counter assignment
  const lapsedTickets = tickets.filter(
    (ticket) =>
      ticket.status === "LAPSED" &&
      ticket.serviceId === assignedCounterService
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

  // Add a ref to store the transfer button handlers
  const transferButtonRefs = React.useRef<
    (null | (() => void))[]
  >([]);

  // Near your other useEffect hooks
  useEffect(() => {
    // Initialize the ref array with the correct length
    transferButtonRefs.current = new Array(
      availableServices.length
    ).fill(null);
  }, [availableServices]);
  // Add keyboard shortcut handler
  useEffect(() => {
    function handleKeyPress(e: KeyboardEvent) {
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
      if (
        currentServingTicket &&
        isPaymentCounter &&
        availableServices.length > 0
      ) {
        // Numpad1-9 or 1-9 for transfer
        let idx = -1;
        if (e.code.startsWith("Numpad")) {
          const num = parseInt(
            e.code.replace("Numpad", ""),
            10
          );
          if (
            !isNaN(num) &&
            num >= 1 &&
            num <= availableServices.length
          )
            idx = num - 1;
        } else if (e.key >= "1" && e.key <= "9") {
          const num = parseInt(e.key, 10);
          if (
            !isNaN(num) &&
            num >= 1 &&
            num <= availableServices.length
          )
            idx = num - 1;
        }
        if (
          idx !== -1 &&
          transferButtonRefs.current[idx]
        ) {
          transferButtonRefs.current[idx]!();
        }
      }

      if (currentServingTicket) {
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
          if (e.key === "r") {
            // Ring bell - new shortcut
            ringBell();
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
      <div className="bg-sky-800 shadow-lg p-0 mb-8 w-full sticky top-0">
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
              {" "}
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
                  <div className="px-4 py-3 mb-2 border-b border-gray-100">
                    <h3 className="font-semibold text-sky-800 mb-2">
                      Settings
                    </h3>
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
                  <h3 className="font-semibold text-sky-800 px-4 mb-1">
                    Quick Links
                  </h3>
                  <div className="px-2 py-1">
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() =>
                        (window.location.href =
                          "/staff/reports")
                      }
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
                          d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                          clipRule="evenodd"
                        />
                      </svg>
                      My Reports
                    </Button>
                  </div>
                  <div className="px-2 py-1">
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 transition-colors flex items-center gap-2"
                    >
                      {" "}
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
      </div>

      {/* Main content area with responsive layout */}
      <div className=" h-[calc(100vh-180px)] flex flex-col lg:flex-row gap-5 lg:gap-5 ml-5 mr-5 my-auto">
        {/* Next in Line section */}
        <div className="w-full lg:w-1/3 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-2xl p-4 lg:p-8 h-full flex flex-col">
            <h2 className="text-xl md:text-6xl font-bold text-sky-600 mb-4 lg:mb-6 text-center flex-none">
              Next
            </h2>
            <div className="flex-1 flex flex-col">
              {/* Regular pending tickets */}
              <div className="flex-0 mb-6">
                {activeTickets.length ? (
                  <div className="flex flex-col items-center w-full mx-auto">
                    <div className="bg-sky-50 rounded-lg w-full h-[80px] lg:h-[100px] xl:h-[100px] flex items-center justify-center mb-4">
                      <span className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-sky-700 text-center px-2 break-all">
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
                    <p className="text-2xl font-medium text-sky-600 mb-2">
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
                      <div className="mt-2 rounded-lg py-3 px-6">
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

              {/* Lapsed and Returning Tickets Container */}
              <div className="flex-1 space-y-10 overflow-y-auto">
                {/* Lapsed Tickets - Show only 2 */}
                {lapsedTickets.length > 0 && (
                  <div className="w-full">
                    <div className="flex justify-between items-center mb-5">
                      <h3 className="text-2xl font-medium text-amber-700 sticky top-0 bg-white">
                        Lapsed Tickets
                      </h3>
                      {lapsedTickets.length >
                        2 && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            setIsLapsedListModalOpen(
                              true
                            )
                          }
                          className="text-5xl text-amber-600 hover:text-white font-medium"
                        >
                          Show All (
                          {lapsedTickets.length})
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {lapsedTickets
                        .slice(0, 2)
                        .map((ticket) => (
                          <div
                            key={ticket.id}
                            className="bg-sky-50 p-2 rounded-lg flex flex-col gap-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-lg text-amber-600 font-medium">
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
                              {ticket.isPrioritized && (
                                <span className="bg-amber-200 text-amber-800 text-sm px-1.5 py-0.5 rounded font-bold">
                                  PWD
                                </span>
                              )}
                            </div>
                            <Button
                              variant="warning"
                              size="md"
                              disabled={
                                calledTicketId !==
                                  null ||
                                servingTicketId !==
                                  null
                              }
                              onClick={() =>
                                recallTicket(
                                  ticket.id
                                )
                              }
                            >
                              <svg
                                className="w-4 h-4"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                              </svg>
                              Recall
                            </Button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Returning Tickets - Show only 2 */}
                {returningTickets.length > 0 && (
                  <div className="w-full">
                    <div className="flex justify-between items-center mb-5">
                      <h3 className="text-2xl font-medium text-sky-700 sticky top-0 bg-white">
                        Returning Tickets
                      </h3>
                      {returningTickets.length >
                        2 && (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            setIsReturningListModalOpen(
                              true
                            )
                          }
                          className="text-5xl text-purple-600 hover:text-white font-medium"
                        >
                          Show All (
                          {
                            returningTickets.length
                          }
                          )
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {returningTickets
                        .slice(0, 2)
                        .map((ticket) => (
                          <div
                            key={ticket.id}
                            className="bg-sky-50 p-2 rounded-lg flex flex-col gap-2 border border-purple-100"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-medium text-sky-800">
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
                              {ticket.isPrioritized && (
                                <span className="bg-amber-200 text-amber-800 font-bold text-sm px-1.5 py-0.5 rounded">
                                  PWD
                                </span>
                              )}
                            </div>
                            <Button
                              variant="primary"
                              size="md"
                              disabled={
                                calledTicketId !==
                                  null ||
                                servingTicketId !==
                                  null
                              }
                              onClick={(e) => {
                                const btn =
                                  e.currentTarget;
                                btn.classList.add(
                                  "scale-95"
                                );
                                btn.innerHTML =
                                  '<svg class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>';
                                setTimeout(() => {
                                  recallTicket(
                                    ticket.id
                                  );
                                }, 200);
                              }}
                            >
                              <svg
                                className={`w-4 h-4 ${
                                  calledTicketId !==
                                    null ||
                                  servingTicketId !==
                                    null
                                    ? "opacity-50"
                                    : ""
                                }`}
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                              </svg>
                              Call
                            </Button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Currently Serving section */}
        <div className="w-full lg:w-1/3 flex-shrink-0 h-full">
          <div className="bg-white rounded-2xl shadow-2xl p-4 lg:p-8 h-full flex flex-col">
            <h2 className="text-xl md:text-6xl font-bold text-sky-600 mb-4 lg:mb-6 text-center flex-none">
              Currently Serving
            </h2>
            <div className="flex-1 flex flex-col">
              {currentServingTicket ? (
                <div className="flex flex-col items-center w-full  mx-auto">
                  <div className="bg-sky-100 rounded-lg w-full h-[80px] lg:h-[100px] flex items-center justify-center mb-4">
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
                  <p className="text-2xl font-medium text-sky-600 mb-2">
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
                      // For Payment Counter buttons
                      <div className="flex flex-col space-y-4 w-full">
                        <Button
                          variant="success"
                          size="lg"
                          withShortcut={true}
                          shortcutKey="C"
                          onClick={async () => {
                            const paymentType =
                              serviceTypes.find(
                                (type) =>
                                  type.code.startsWith(
                                    "P-"
                                  )
                              );
                            if (paymentType) {
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
                                        "SERVED",
                                      serviceTypeId:
                                        paymentType.id,
                                      servingEnd:
                                        new Date(),
                                    }
                                  ),
                                }
                              );
                              setServingTicketId(
                                null
                              );
                              setCalledTicketId(
                                null
                              );
                              fetchTickets();
                              fetchUserStatistics();
                            }
                          }}
                        >
                          Complete Payment
                        </Button>

                        {/* Transfers - Direct buttons instead of modal */}
                        <div className="grid grid-cols-1 gap-2">
                          {availableServices.map(
                            (service, index) => {
                              // Define the click handler function separately
                              const handleTransfer =
                                async () => {
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
                                };

                              // Store the handler in the ref array
                              transferButtonRefs.current[
                                index
                              ] = handleTransfer;

                              return (
                                <Button
                                  key={service.id}
                                  variant="secondary"
                                  size="lg"
                                  withShortcut={
                                    true
                                  }
                                  shortcutKey={(
                                    index + 1
                                  ).toString()}
                                  onClick={
                                    handleTransfer
                                  } // Use the same handler here
                                  className="w-full justify-between"
                                >
                                  <span>
                                    {service.name}
                                  </span>
                                  <span className="text-xs bg-sky-700 px-2 py-1 rounded">
                                    {service.code}
                                  </span>
                                </Button>
                              );
                            }
                          )}
                        </div>

                        {/* Cancel button */}
                        <Button
                          variant="danger"
                          size="lg"
                          withShortcut={true}
                          shortcutKey="X"
                          onClick={() => {
                            fetch(
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
                                      "CANCELLED",
                                  }
                                ),
                              }
                            ).then(() => {
                              setServingTicketId(
                                null
                              );
                              fetchTickets();
                            });
                          }}
                        >
                          Cancel Transaction
                        </Button>
                      </div>
                    ) : (
                      // For non-payment counters - Complete Transaction button
                      <div className="flex flex-col space-y-4 w-full">
                        <Button
                          variant="success"
                          size="lg"
                          withShortcut={true}
                          shortcutKey="C"
                          onClick={() =>
                            openServiceTypeModal(
                              currentServingTicket.id
                            )
                          }
                        >
                          Complete Transaction
                        </Button>
                      </div>
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
                        <div className="bg-green-50 rounded-lg w-full  h-[80px] md:h-[100px] flex items-center justify-center mb-6 shadow-md">
                          <span
                            className={`${getTicketTextSizeClass(
                              ticket
                            )} font-bold text-green-800 text-center px-2 break-all`}
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
                        <p className="text-2xl font-medium text-sky-600 mb-2">
                          {ticket.service?.name ||
                            "Unknown Service"}
                        </p>
                        {ticket.isPrioritized && (
                          <span className="bg-green-600 text-green-500 text-white px-3 py-1 rounded-full font-medium mb-4">
                            Priority
                          </span>
                        )}
                        <p className="text-center text-sky-600 mb-4 animate-pulse font-medium text-2xl">
                          Ticket Called
                        </p>
                        <div className="mt-6 w-full space-y-4">
                          {isPaymentCounter ? (
                            // For payment counter, we show Start Serving button which works the same
                            // as the regular Start Serving button but without confirmation dialog
                            <div className="flex flex-col space-y-4 w-full">
                              <Button
                                variant="success"
                                size="lg"
                                onClick={() =>
                                  startServing(
                                    ticket.id
                                  )
                                }
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
                              </Button>
                            </div>
                          ) : (
                            // For non-payment counters, keep original buttons
                            <div className="flex flex-col space-y-4 w-full">
                              <Button
                                variant="success"
                                size="lg"
                                withShortcut={
                                  true
                                }
                                shortcutKey="S"
                                onClick={() =>
                                  startServing(
                                    ticket.id
                                  )
                                }
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-7 w-7 mr-3"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-4a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1H9z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                Start Serving
                              </Button>
                              <Button
                                variant="primary"
                                size="lg"
                                withShortcut={
                                  true
                                }
                                shortcutKey="R"
                                onClick={ringBell}
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-6 w-6 mr-2"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                                </svg>
                                Ring
                              </Button>
                              <Button
                                variant="warning"
                                size="lg"
                                withShortcut={
                                  true
                                }
                                shortcutKey="L"
                                onClick={() =>
                                  openLapsedConfirmModal(
                                    ticket.id
                                  )
                                }
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-7 w-7 mr-3"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-4a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1H9z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                Mark as Lapsed
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="flex flex-col items-center w-full">
                  <p className="text-center text-gray-500 mb-6">
                    No ticket currently being
                    served
                  </p>
                  <div className="flex flex-col space-y-4 w-full mt-56">
                    <Button
                      variant="primary"
                      size="lg"
                      withShortcut={true}
                      shortcutKey="N"
                      disabled={
                        !hasPendingTickets ||
                        isAnyActive
                      }
                      onClick={callNextTicket}
                    >
                      Call Next Ticket
                    </Button>

                    {!hasPendingTickets && (
                      <p className="text-xs text-gray-500 text-center mt-1">
                        No pending tickets in
                        queue
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Statistics section */}
        <div className="w-full lg:w-1/3 flex-shrink-1">
          <div className="bg-white rounded-2xl shadow-2xl p-4 lg:p-8 h-full flex flex-col">
            <h2 className="text-xl md:text-6xl font-bold text-sky-600 mb-4 lg:mb-6 text-center flex-none">
              Your Statistics
            </h2>
            <div className="flex-1 flex flex-col ">
              <div className="space-y-4 lg:space-y-8 w-full mx-auto">
                <div className="bg-sky-50 rounded-lg p-4 lg:p-6">
                  <p className="text-base lg:text-lg text-sky-700 font-medium">
                    Total Served
                  </p>
                  <p className="text-2xl lg:text-3xl xl:text-4xl font-bold text-sky-800 mt-2">
                    {userStats.totalServed}
                  </p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 lg:p-6">
                  <p className="text-base lg:text-lg text-green-700 font-medium">
                    Today
                  </p>
                  <p className="text-2xl lg:text-3xl xl:text-4xl font-bold text-green-800 mt-2">
                    {userStats.todayServed}
                  </p>
                </div>
                <div className="bg-amber-50 rounded-lg p-4 lg:p-6">
                  <p className="text-base lg:text-lg text-amber-700 font-medium">
                    Avg. Service Time
                  </p>
                  <p className="text-2xl lg:text-3xl xl:text-4xl font-bold text-amber-800 mt-2">
                    {formatAverageTime(
                      userStats.averageServiceTime
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transfer Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-5 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 lg:p-6 w-full max-w-[384px] lg:max-w-[480px] shadow-2xl">
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
                    <Button
                      key={service.id}
                      variant="secondary"
                      size="lg"
                      onClick={() =>
                        openTransferConfirmation(
                          service
                        )
                      }
                      className="w-full justify-between"
                    >
                      <span>{service.name}</span>
                      <span className="text-xs bg-sky-700 px-2 py-1 rounded">
                        {service.code}
                      </span>
                    </Button>
                  )
                )}
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                variant="danger"
                size="md"
                onClick={() => {
                  setIsTransferModalOpen(false);
                  setTicketToTransfer(null);
                  setSelectedServiceId("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add new Lapsed Confirmation Modal */}
      {isLapsedConfirmModalOpen &&
        ticketToLapse && (
          <div className="fixed inset-0 bg-black bg-opacity-5 flex items-center justify-center min-h-screen z-50">
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
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1H9z"
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
                <Button
                  variant="danger"
                  size="md"
                  onClick={() => {
                    setIsLapsedConfirmModalOpen(
                      false
                    );
                    setTicketToLapse(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="success"
                  size="md"
                  onClick={() => {
                    const ticketId =
                      ticketToLapse;
                    if (ticketId) {
                      markLapsed(ticketId);
                    }
                  }}
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
                </Button>
              </div>
            </div>
          </div>
        )}

      {/* Service Type Modal with remarks field */}
      {isServiceTypeModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-5 flex items-center justify-center z-50">
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
                  xmlns="http://www.w3.org/2000/svg"
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

              {/* Selectable service types */}
              <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 mb-4">
                {serviceTypes
                  .filter(
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
                  )
                  .map((type) => (
                    <div
                      key={type.id}
                      onClick={() =>
                        setSelectedServiceTypeId(
                          type.id
                        )
                      }
                      className={`cursor-pointer border p-3 rounded-lg transition-colors ${
                        selectedServiceTypeId ===
                        type.id
                          ? "bg-sky-100 border-sky-500 shadow-sm"
                          : "bg-white border-gray-200 hover:bg-sky-50"
                      }`}
                    >
                      <div className="flex flex-row justify-between w-full">
                        <span className="font-semibold text-sky-900 mb-1">
                          {type.name}
                        </span>
                        <span className="text-xs bg-sky-600 text-white px-2 py-0.5 rounded">
                          {type.code}
                        </span>
                      </div>
                    </div>
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

              {/* Remarks text area */}
              <div className="mt-4">
                <label
                  htmlFor="remarks"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Additional Remarks (Optional)
                </label>
                <textarea
                  id="remarks"
                  rows={3}
                  value={serviceTypeRemarks}
                  onChange={(e) =>
                    setServiceTypeRemarks(
                      e.target.value
                    )
                  }
                  placeholder="Enter any additional notes or comments about this service..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="danger"
                size="md"
                onClick={() => {
                  setIsServiceTypeModalOpen(
                    false
                  );
                  setTicketToComplete(null);
                  setSelectedServiceTypeId("");
                  setServiceTypeRemarks("");
                  setServiceTypeSearchQuery("");
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                disabled={!selectedServiceTypeId}
                onClick={() => {
                  const selectedType =
                    serviceTypes.find(
                      (type) =>
                        type.id ===
                        selectedServiceTypeId
                    );
                  if (selectedType) {
                    openServiceTypeConfirmation(
                      selectedType,
                      serviceTypeRemarks
                    );
                  }
                }}
              >
                Submit
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add new Lapsed Confirmation Modal */}
      {isLapsedConfirmModalOpen &&
        ticketToLapse && (
          <div className="fixed inset-0 bg-black bg-opacity-5 flex items-center justify-center min-h-screen z-50">
            <div className="bg-white rounded-lg p-8 w-[500px] shadow-2xl transform transition-all animate-fade-in-down">
              <div className="flex items-centermb-6 text-amber-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-12 w-12 mr-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1H9z"
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
                <Button
                  variant="danger"
                  size="md"
                  onClick={() => {
                    setIsLapsedConfirmModalOpen(
                      false
                    );
                    setTicketToLapse(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="success"
                  size="md"
                  onClick={() => {
                    const ticketId =
                      ticketToLapse;
                    if (ticketId) {
                      markLapsed(ticketId);
                    }
                  }}
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
                </Button>
              </div>
            </div>
          </div>
        )}

      {/* Add new Lapsed Confirmation Modal */}
      {isLapsedConfirmModalOpen &&
        ticketToLapse && (
          <div className="fixed inset-0 bg-black bg-opacity-5 flex items-center justify-center min-h-screen z-50">
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
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1H9z"
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
                <Button
                  variant="danger"
                  size="md"
                  onClick={() => {
                    setIsLapsedConfirmModalOpen(
                      false
                    );
                    setTicketToLapse(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="success"
                  size="md"
                  onClick={() => {
                    const ticketId =
                      ticketToLapse;
                    if (ticketId) {
                      markLapsed(ticketId);
                    }
                  }}
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
                </Button>
              </div>
            </div>
          </div>
        )}

      {/* Add new Lapsed Confirmation Modal */}
      {isLapsedConfirmModalOpen &&
        ticketToLapse && (
          <div className="fixed inset-0 bg-black bg-opacity-5 flex items-center justify-center min-h-screen z-50">
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
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1H9z"
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
                <Button
                  variant="danger"
                  size="md"
                  onClick={() => {
                    setIsLapsedConfirmModalOpen(
                      false
                    );
                    setTicketToLapse(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="success"
                  size="md"
                  onClick={() => {
                    const ticketId =
                      ticketToLapse;
                    if (ticketId) {
                      markLapsed(ticketId);
                    }
                  }}
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
                </Button>
              </div>
            </div>
          </div>
        )}

      {/* Add new Lapsed Confirmation Modal */}
      {isLapsedConfirmModalOpen &&
        ticketToLapse && (
          <div className="fixed inset-0 bg-black bg-opacity-5 flex items-center justify-center min-h-screen z-50">
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
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1H9z"
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
                <Button
                  variant="danger"
                  size="md"
                  onClick={() => {
                    setIsLapsedConfirmModalOpen(
                      false
                    );
                    setTicketToLapse(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="success"
                  size="md"
                  onClick={() => {
                    const ticketId =
                      ticketToLapse;
                    if (ticketId) {
                      markLapsed(ticketId);
                    }
                  }}
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
                </Button>
              </div>
            </div>
          </div>
        )}

      {/* Add new Lapsed Confirmation Modal */}
      {isLapsedConfirmModalOpen &&
        ticketToLapse && (
          <div className="fixed inset-0 bg-black bg-opacity-5 flex items-center justify-center min-h-screen z-50">
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
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1H9z"
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
                <Button
                  variant="danger"
                  size="md"
                  onClick={() => {
                    setIsLapsedConfirmModalOpen(
                      false
                    );
                    setTicketToLapse(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="success"
                  size="md"
                  onClick={() => {
                    const ticketId =
                      ticketToLapse;
                    if (ticketId) {
                      markLapsed(ticketId);
                    }
                  }}
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
                </Button>
              </div>
            </div>
          </div>
        )}

      {/* Add new Lapsed Confirmation Modal */}
      {isLapsedConfirmModalOpen &&
        ticketToLapse && (
          <div className="fixed inset-0 bg-black bg-opacity-5 flex items-center justify-center min-h-screen z-50">
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
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1H9z"
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
                <Button
                  variant="danger"
                  size="md"
                  onClick={() => {
                    setIsLapsedConfirmModalOpen(
                      false
                    );
                    setTicketToLapse(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="success"
                  size="md"
                  onClick={() => {
                    const ticketId =
                      ticketToLapse;
                    if (ticketId) {
                      markLapsed(ticketId);
                    }
                  }}
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
                </Button>
              </div>
            </div>
          </div>
        )}

      {/* Add new Lapsed Confirmation Modal */}
      {isLapsedConfirmModalOpen &&
        ticketToLapse && (
          <div className="fixed inset-0 bg-black bg-opacity-5 flex items-center justify-center min-h-screen z-50">
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
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1H9z"
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
                <Button
                  variant="danger"
                  size="md"
                  onClick={() => {
                    setIsLapsedConfirmModalOpen(
                      false
                    );
                    setTicketToLapse(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="success"
                  size="md"
                  onClick={() => {
                    const ticketId =
                      ticketToLapse;
                    if (ticketId) {
                      markLapsed(ticketId);
                    }
                  }}
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
                </Button>
              </div>
            </div>
          </div>
        )}

      {/* Add new Lapsed Confirmation Modal */}
      {isLapsedConfirmModalOpen &&
        ticketToLapse && (
          <div className="fixed inset-0 bg-black bg-opacity-5 flex items-center justify-center min-h-screen z-50">
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
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1H9z"
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
                <Button
                  variant="danger"
                  size="md"
                  onClick={() => {
                    setIsLapsedConfirmModalOpen(
                      false
                    );
                    setTicketToLapse(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="success"
                  size="md"
                  onClick={() => {
                    const ticketId =
                      ticketToLapse;
                    if (ticketId) {
                      markLapsed(ticketId);
                    }
                  }}
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
                </Button>
              </div>
            </div>
          </div>
        )}

      {/* Service Type Confirmation Modal */}
      {isServiceTypeConfirmModalOpen &&
        serviceTypeToConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-5 flex items-center justify-center z-50">
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
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm11 13a1 1 0 01-1 1H2a1 1 0 01-1-1v-2a1 1 0 011-1h16a1 1 0 011 1v2z"
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

                    {/* Show remarks if provided */}
                    {serviceTypeRemarks.trim() && (
                      <div className="mt-4 pt-4 border-t border-green-200">
                        <h4 className="text-sm font-medium text-green-700 mb-1">
                          Additional Remarks:
                        </h4>
                        <p className="text-base text-green-600 text-left whitespace-pre-wrap">
                          {serviceTypeRemarks}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <Button
                  variant="danger"
                  size="md"
                  onClick={() => {
                    setIsServiceTypeConfirmModalOpen(
                      false
                    );
                    setServiceTypeToConfirm(null);
                    setIsServiceTypeModalOpen(
                      true
                    ); // Reopen the selection modal
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() =>
                    completeTransaction(true)
                  }
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
                  Complete Transaction
                </Button>
              </div>
            </div>
          </div>
        )}

      {/* Lapsed List Modal */}
      {isLapsedListModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[800px] max-h-[80vh] shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-amber-700">
                All Lapsed Tickets
              </h3>
              <Button
                variant=""
                size="sm"
                onClick={() =>
                  setIsLapsedListModalOpen(false)
                }
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-3 overflow-y-auto max-h-[60vh] p-2">
              {lapsedTickets.map((ticket) => (
                // Same ticket card component as before
                <div
                  key={ticket.id}
                  className="bg-sky-50 p-2 rounded-lg flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
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
                    {ticket.isPrioritized && (
                      <span className="bg-amber-200 text-amber-800 font-bold text-xs px-1.5 py-0.5 rounded">
                        PWD
                      </span>
                    )}
                  </div>
                  <Button
                    variant="warning"
                    size="sm"
                    disabled={
                      calledTicketId !== null ||
                      servingTicketId !== null
                    }
                    onClick={() =>
                      recallTicket(ticket.id)
                    }
                  >
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    Recall
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Returning List Modal */}
      {isReturningListModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[800px] max-h-[80vh] shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-sky-700">
                All Returning Tickets
              </h3>
              <Button
                variant=""
                size="sm"
                onClick={() =>
                  setIsReturningListModalOpen(
                    false
                  )
                }
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-3 overflow-y-auto max-h-[60vh] p-2">
              {returningTickets.map((ticket) => (
                // Same ticket card component as before
                <div
                  key={ticket.id}
                  className="bg-sky-50 p-2 rounded-lg flex flex-col gap-2 border border-purple-100"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-sky-800">
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
                    {ticket.isPrioritized && (
                      <span className="bg-amber-200 text-amber-800 font-bold text-xs px-1.5 py-0.5 rounded">
                        PWD
                      </span>
                    )}
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={
                      calledTicketId !== null ||
                      servingTicketId !== null
                    }
                    onClick={(e) => {
                      const btn = e.currentTarget;
                      btn.classList.add(
                        "scale-95"
                      );
                      btn.innerHTML =
                        '<svg class="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>';
                      setTimeout(() => {
                        recallTicket(ticket.id);
                      }, 200);
                    }}
                  >
                    <svg
                      className={`w-4 h-4 ${
                        calledTicketId !== null ||
                        servingTicketId !== null
                          ? "opacity-50"
                          : ""
                      }`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    Call
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
