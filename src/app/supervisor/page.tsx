"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  UsersIcon,
  ChartBarIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

type SupervisedService = {
  id: string;
  name: string;
  code: string;
};

export default function SupervisorDashboard() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<
    SupervisedService[]
  >([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (
      status === "authenticated" &&
      session?.user
    ) {
      // Extract supervisedService directly from session if available
      if (session.user.supervisedService) {
        setServices([
          session.user.supervisedService,
        ]);
        setLoading(false);
      } else {
        // Fall back to API call if not available in session
        fetchSupervisedServices();
      }
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, session]);

  async function fetchSupervisedServices() {
    try {
      const response = await fetch(
        `/api/supervisor/services`
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch supervised services"
        );
      }

      const data = await response.json();
      // If the API returns a single service object, wrap it in an array
      setServices(
        Array.isArray(data) ? data : [data]
      );
    } catch (err) {
      console.error(
        "Error fetching supervised services:",
        err
      );
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred"
      );
    } finally {
      setLoading(false);
    }
  }

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
            Supervisor Dashboard
          </h1>
          <p className="text-xl text-red-500">
            Please log in to access the dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-sky-50 to-sky-100 ">
      <div className="h-[90vh]">
        <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6 h-[93vh]">
          <h1 className="text-3xl font-bold text-sky-800 mb-6">
            Supervisor Dashboard
          </h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {services.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-lg text-gray-500">
                You are not assigned to supervise
                any services.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <div
                  key={service.id}
                  className="bg-sky-50 rounded-xl p-6 shadow-md"
                >
                  <h2 className="text-xl font-bold text-sky-800 mb-3">
                    {service.name}
                  </h2>
                  <p className="text-sm text-sky-600 mb-4">
                    Code: {service.code}
                  </p>

                  <div className="grid grid-cols-1 gap-3 mt-4">
                    <Link
                      href={`/supervisor/user?serviceId=${service.id}`}
                      className="flex items-center bg-white p-3 rounded-lg shadow-sm hover:bg-sky-100 transition-colors"
                    >
                      <UsersIcon className="h-5 w-5 text-sky-600 mr-2" />
                      <span className="text-sky-800">
                        Manage Users
                      </span>
                    </Link>

                    <Link
                      href={`/supervisor/report?serviceId=${service.id}`}
                      className="flex items-center bg-white p-3 rounded-lg shadow-sm hover:bg-sky-100 transition-colors"
                    >
                      <ChartBarIcon className="h-5 w-5 text-sky-600 mr-2" />
                      <span className="text-sky-800">
                        Service Reports
                      </span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
