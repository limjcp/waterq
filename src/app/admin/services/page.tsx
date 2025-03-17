"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

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
  const { status } = useSession();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<string>("");
  const [isAddingType, setIsAddingType] = useState(false);
  const [newServiceType, setNewServiceType] = useState({
    name: "",
    code: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [deletingTypeId, setDeletingTypeId] = useState<string | null>(null);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [deleteServiceId, setDeleteServiceId] = useState<string>("");
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Generate code based on service and type name
  const generateTypeCode = (serviceId: string, typeName: string) => {
    // Find the selected service
    const service = services.find((s) => s.id === serviceId);
    if (!service || !typeName) return "";

    // Get first letter of service
    const serviceInitial = service.name.charAt(0).toUpperCase();

    // Get initials of words in the type name
    const typeInitials = typeName
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase())
      .join("");

    return `${serviceInitial}-${typeInitials}`;
  };

  // Update service selection and regenerate code
  const handleServiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const serviceId = e.target.value;
    setSelectedService(serviceId);

    // Update the code based on new service and current name
    const newCode = generateTypeCode(serviceId, newServiceType.name);
    setNewServiceType((prev) => ({
      ...prev,
      code: newCode,
    }));
  };

  // Update type name and regenerate code
  const handleTypeNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;

    // Update the code based on current service and new name
    const newCode = generateTypeCode(selectedService, name);
    setNewServiceType({
      name: name,
      code: newCode,
    });
  };

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
    setError(null); // Reset any previous errors

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
      } else {
        // Handle API error responses
        const errorData = await res.json();
        setError(errorData.error || "Failed to add service type");
      }
    } catch (error) {
      console.error("Error adding service type:", error);
      setError("Network error occurred. Please try again.");
    }
  };

  // Handle deleting a service type
  const handleDeleteServiceType = async () => {
    if (!deletingTypeId || !deleteServiceId) return;

    try {
      const res = await fetch(
        `/api/service/type?serviceId=${deleteServiceId}&typeId=${deletingTypeId}`,
        {
          method: "DELETE",
        }
      );

      if (res.ok) {
        // Refresh services list
        const servicesRes = await fetch("/api/service/list-with-types");
        if (servicesRes.ok) {
          const data = await servicesRes.json();
          setServices(data);
        }

        // Close the confirmation dialog
        setDeleteConfirmVisible(false);
        setDeletingTypeId(null);
        setDeleteServiceId("");
      } else {
        // Handle API error responses - check if there's content to parse
        let errorMessage = "Failed to delete service type";

        // Only try to parse as JSON if there's content
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          try {
            const text = await res.text();
            if (text) {
              const errorData = JSON.parse(text);
              errorMessage = errorData.error || errorMessage;
            }
          } catch (parseError) {
            console.error("Error parsing response:", parseError);
          }
        }

        setError(errorMessage);
      }
    } catch (error) {
      console.error("Error deleting service type:", error);
      setError("Network error occurred. Please try again.");
    }
  };

  // Open delete confirmation dialog
  const confirmDeleteType = (serviceId: string, typeId: string) => {
    setDeleteServiceId(serviceId);
    setDeletingTypeId(typeId);
    setDeleteConfirmVisible(true);
  };

  const toggleService = (serviceId: string) => {
    setExpandedService(expandedService === serviceId ? null : serviceId);
    setSearchQuery(""); // Reset search when toggling
  };

  const filterServiceTypes = (types: ServiceType[]) => {
    if (!searchQuery) return types;
    return types.filter(
      (type) =>
        type.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        type.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
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
              className="bg-sky-500 hover:bg-sky-600 text-white font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
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
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-sky-600">
                            {service.serviceTypes.length} types
                          </span>
                          <button
                            onClick={() => toggleService(service.id)}
                            className="text-sky-600 hover:text-sky-700 flex items-center gap-1"
                          >
                            {expandedService === service.id ? (
                              <>
                                <span className="text-sm">Hide</span>
                                <ChevronUpIcon className="h-4 w-4" />
                              </>
                            ) : (
                              <>
                                <span className="text-sm">View More</span>
                                <ChevronDownIcon className="h-4 w-4" />
                              </>
                            )}
                          </button>
                        </div>

                        {expandedService === service.id && (
                          <div className="mt-2 space-y-2">
                            <div className="relative">
                              <input
                                type="text"
                                placeholder="Search types..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-8 pr-4 py-2 border border-sky-200 rounded-lg text-sm"
                              />
                              <MagnifyingGlassIcon className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                            </div>
                            <div className="max-h-48 overflow-y-auto">
                              <div className="flex flex-wrap gap-2 p-2">
                                {filterServiceTypes(service.serviceTypes).map(
                                  (type) => (
                                    <div
                                      key={type.id}
                                      className="bg-sky-100 text-sky-700 px-3 py-1.5 rounded-full text-sm flex items-center gap-2"
                                    >
                                      <div>
                                        <div className="font-medium">
                                          {type.name}
                                        </div>
                                        <div className="text-xs text-sky-600">
                                          {type.code}
                                        </div>
                                      </div>
                                      <button
                                        onClick={() =>
                                          confirmDeleteType(service.id, type.id)
                                        }
                                        className="text-red-500 hover:text-red-700 focus:outline-none ml-2"
                                        title="Delete service type"
                                      >
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          className="h-4 w-4"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                          />
                                        </svg>
                                      </button>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Delete Confirmation Modal */}
          {deleteConfirmVisible && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  Confirm Deletion
                </h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to delete this service type? This action
                  cannot be undone.
                </p>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg">
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                )}

                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => {
                      setDeleteConfirmVisible(false);
                      setDeletingTypeId(null);
                      setDeleteServiceId("");
                      setError(null);
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteServiceType}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Add Service Type Modal */}
          {isAddingType && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-white rounded-2xl p-8 max-w-md w-full">
                <h2 className="text-2xl font-bold text-sky-800 mb-6">
                  Add Service Type
                </h2>

                {/* Show error message if present */}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg">
                    <p className="text-sm font-medium">{error}</p>
                  </div>
                )}

                <form onSubmit={handleAddServiceType}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-sky-700 mb-2">
                      Select Service
                    </label>
                    <select
                      value={selectedService}
                      onChange={handleServiceChange}
                      className="w-full px-4 py-2 border border-sky-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                      required
                      aria-label="Select service"
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
                      onChange={handleTypeNameChange}
                      className="w-full px-4 py-2 border border-sky-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                      required
                      placeholder="Enter type name"
                      aria-label="Type name"
                    />
                  </div>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-sky-700 mb-2">
                      Type Code
                    </label>
                    <input
                      type="text"
                      value={newServiceType.code}
                      readOnly
                      className="w-full px-4 py-2 bg-gray-50 border border-sky-200 rounded-lg text-gray-600"
                      aria-label="Type code"
                      title="Auto-generated code"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Code is automatically generated based on service and type
                      name
                    </p>
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
