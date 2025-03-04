"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

type Service = {
  id: string;
  code: string;
  name: string;
  serviceTypes: ServiceType[];
};

type ServiceType = {
  id: string;
  code: string;
  name: string;
};

export default function ServicesManagement() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<string>("");
  const [isAddingType, setIsAddingType] = useState(false);
  const [newServiceType, setNewServiceType] = useState({
    name: "",
    code: "",
  });

  // Fetch services and their types
  useEffect(() => {
    async function fetchServices() {
      if (status === "authenticated") {
        try {
          const res = await fetch("/api/service/list-with-types");
          if (res.ok) {
            const data = await res.json();
            setServices(data);
          }
        } catch (error) {
          console.error("Error fetching services:", error);
        } finally {
          setLoading(false);
        }
      }
    }

    fetchServices();
  }, [status]);

  // Handle adding new service type
  const handleAddServiceType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !newServiceType.name || !newServiceType.code)
      return;

    try {
      const res = await fetch("/api/service/type", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          serviceId: selectedService,
          ...newServiceType,
        }),
      });

      if (res.ok) {
        // Refresh services list
        const servicesRes = await fetch("/api/service/list-with-types");
        if (servicesRes.ok) {
          const data = await servicesRes.json();
          setServices(data);
        }

        // Reset form
        setNewServiceType({ name: "", code: "" });
        setIsAddingType(false);
      }
    } catch (error) {
      console.error("Error adding service type:", error);
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
            Services Management
          </h1>
          <p className="text-xl text-red-500">
            Please log in to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-sky-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-sky-800">
              Services Management
            </h1>
            <button
              onClick={() => setIsAddingType(true)}
              className="bg-sky-500 hover:bg-sky-600 text-white font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Add Service Type
            </button>
          </div>

          {/* Services Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-sky-100">
              <thead>
                <tr className="bg-sky-50">
                  <th className="py-3 px-4 text-left font-medium text-sky-700 border-b">
                    Service Name
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-sky-700 border-b">
                    Service Code
                  </th>
                  <th className="py-3 px-4 text-left font-medium text-sky-700 border-b">
                    Service Types
                  </th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.id} className="border-b border-sky-50">
                    <td className="py-3 px-4">{service.name}</td>
                    <td className="py-3 px-4">{service.code}</td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-2">
                        {service.serviceTypes.map((type) => (
                          <span
                            key={type.id}
                            className="bg-sky-100 text-sky-700 px-2 py-1 rounded-full text-sm"
                          >
                            {type.name}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add Service Type Modal */}
          {isAddingType && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-white rounded-2xl p-8 max-w-md w-full">
                <h2 className="text-2xl font-bold text-sky-800 mb-6">
                  Add Service Type
                </h2>
                <form onSubmit={handleAddServiceType}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-sky-700 mb-2">
                      Select Service
                    </label>
                    <select
                      value={selectedService}
                      onChange={(e) => setSelectedService(e.target.value)}
                      className="w-full px-4 py-2 border border-sky-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                      required
                    >
                      <option value="">Select a service...</option>
                      {services.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-sky-700 mb-2">
                      Type Name
                    </label>
                    <input
                      type="text"
                      value={newServiceType.name}
                      onChange={(e) =>
                        setNewServiceType({
                          ...newServiceType,
                          name: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 border border-sky-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                      required
                    />
                  </div>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-sky-700 mb-2">
                      Type Code
                    </label>
                    <input
                      type="text"
                      value={newServiceType.code}
                      onChange={(e) =>
                        setNewServiceType({
                          ...newServiceType,
                          code: e.target.value.toUpperCase(),
                        })
                      }
                      className="w-full px-4 py-2 border border-sky-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-4">
                    <button
                      type="button"
                      onClick={() => setIsAddingType(false)}
                      className="px-4 py-2 text-sky-600 hover:text-sky-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg"
                    >
                      Add Type
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
