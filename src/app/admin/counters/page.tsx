"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  PlusCircleIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import Button from "@/components/Button";

type Counter = {
  id: string;
  name: string;
  code: string;
  serviceId: string;
  service?: {
    name: string;
    code: string;
  };
};

type Service = {
  id: string;
  name: string;
  code: string;
};

export default function CountersManagement() {
  const { data: session, status } = useSession();
  const [counters, setCounters] = useState<Counter[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Add these pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Form states
  const [isAddingCounter, setIsAddingCounter] = useState(false);
  const [editingCounter, setEditingCounter] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    serviceId: "",
  });

  useEffect(() => {
    if (status === "authenticated") {
      fetchServices();
      fetchCounters();
    }
  }, [status]);

  // Effect to auto-generate name and code when serviceId changes
  useEffect(() => {
    if (!isAddingCounter || editingCounter || !formData.serviceId) return;

    const selectedService = services.find((s) => s.id === formData.serviceId);
    if (!selectedService) return;

    // Find existing counters for this service to determine next number
    const serviceCounters = counters.filter(
      (c) => c.serviceId === formData.serviceId
    );

    // Extract numbers from existing counter codes for this service
    const existingNumbers = serviceCounters
      .map((c) => {
        const match = c.code.match(
          new RegExp(`^${selectedService.code}(\\d+)$`)
        );
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter((n) => !isNaN(n));

    // Find the next available number
    const nextNumber =
      existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;

    // Generate name and code
    const newName = `${selectedService.name} ${nextNumber}`;
    const newCode = `${selectedService.code}${nextNumber}`;

    setFormData((prev) => ({
      ...prev,
      name: newName,
      code: newCode,
    }));
  }, [formData.serviceId, services, counters, isAddingCounter, editingCounter]);

  const fetchCounters = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/counters");
      if (!response.ok) {
        throw new Error("Failed to fetch counters");
      }
      const data = await response.json();
      setCounters(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/services");
      if (!response.ok) {
        throw new Error("Failed to fetch services");
      }
      const data = await response.json();
      setServices(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      let response;
      if (editingCounter) {
        // Update existing counter
        response = await fetch(`/api/counters/${editingCounter}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      } else {
        // Create new counter
        response = await fetch("/api/counters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            `Failed to ${editingCounter ? "update" : "create"} counter`
        );
      }

      // Reset form and refresh data
      setSuccess(
        `Counter ${editingCounter ? "updated" : "created"} successfully!`
      );
      setFormData({ name: "", code: "", serviceId: "" });
      setIsAddingCounter(false);
      setEditingCounter(null);
      fetchCounters();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = (counter: Counter) => {
    setFormData({
      name: counter.name,
      code: counter.code,
      serviceId: counter.serviceId,
    });
    setEditingCounter(counter.id);
    setIsAddingCounter(true);
    setError("");
    setSuccess("");
  };

  const handleDelete = async (counterId: string) => {
    if (!confirm("Are you sure you want to delete this counter?")) return;

    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/counters/${counterId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete counter");
      }

      setSuccess("Counter deleted successfully!");
      fetchCounters();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const cancelForm = () => {
    setFormData({ name: "", code: "", serviceId: "" });
    setIsAddingCounter(false);
    setEditingCounter(null);
    setError("");
    setSuccess("");
  };

  const paginatedCounters = counters.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setTotalPages(Math.ceil(counters.length / itemsPerPage));
  }, [counters]);

  if (status === "loading" || loading) {
    return (
      <div className="animate-spin h-8 w-8 border-4 border-sky-500 border-t-transparent rounded-full mx-auto"></div>
    );
  }

  return (
    <div className="max-w-10xl mx-auto bg-white rounded-2xl shadow-2xl p-8 h-[93vh]">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-sky-800">Service Counters</h1>
        {!isAddingCounter && (
          <Button variant="primary" onClick={() => setIsAddingCounter(true)}>
            <PlusCircleIcon className="h-5 w-5 mr-2" />
            Add Counter
          </Button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg mb-6">
          {success}
        </div>
      )}

      {/* Add/Edit Counter Form */}
      {isAddingCounter && (
        <div className="mb-8 bg-sky-50 p-6 rounded-xl border border-sky-100">
          <h2 className="text-xl font-semibold text-sky-700 mb-4">
            {editingCounter ? "Edit Counter" : "Add New Counter"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-sky-700 mb-2">
                  Assigned Service
                </label>
                <select
                  name="serviceId"
                  value={formData.serviceId}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-sky-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">Select a service</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} ({service.code})
                    </option>
                  ))}
                </select>
              </div>

              {(editingCounter || formData.serviceId) && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-sky-700 mb-2">
                      Counter Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Auto-generated name"
                      className={`w-full px-4 py-2 border border-sky-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                        !editingCounter ? "bg-gray-50" : ""
                      }`}
                      readOnly={!editingCounter}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-sky-700 mb-2">
                      Counter Code
                    </label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleChange}
                      required
                      placeholder="Auto-generated code"
                      className={`w-full px-4 py-2 border border-sky-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                        !editingCounter ? "bg-gray-50" : ""
                      }`}
                      readOnly={!editingCounter}
                    />
                    {!editingCounter && (
                      <p className="text-xs text-sky-600 mt-1">
                        Code is automatically generated based on service
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button
                type="button"
                onClick={cancelForm}
                size="md"
                variant="danger"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                onClick={handleSubmit}
                size="md"
                variant="success"
              >
                {editingCounter ? "Update Counter" : "Create Counter"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Counters Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-sky-100">
          <thead>
            <tr className="bg-sky-50">
              <th className="py-3 px-4 text-left font-medium text-sky-700 border-b">
                Name
              </th>
              <th className="py-3 px-4 text-left font-medium text-sky-700 border-b">
                Code
              </th>
              <th className="py-3 px-4 text-left font-medium text-sky-700 border-b">
                Service
              </th>
              <th className="py-3 px-4 text-left font-medium text-sky-700 border-b">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedCounters.length > 0 ? (
              paginatedCounters.map((counter) => (
                <tr
                  key={counter.id}
                  className="border-b border-sky-50 hover:bg-sky-50"
                >
                  <td className="py-3 px-4">{counter.name}</td>
                  <td className="py-3 px-4">{counter.code}</td>
                  <td className="py-3 px-4">
                    {counter.service ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sky-100 text-sky-800">
                        {counter.service.name} ({counter.service.code})
                      </span>
                    ) : (
                      <span className="text-gray-400">No service assigned</span>
                    )}
                  </td>
                  <td className="flex flex-row gap-1  py-3 px-4 text-right">
                    <Button
                      variant="primary"
                      onClick={() => handleEdit(counter)}
                    >
                      <PencilIcon className="h-5 w-5 inline" />
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleDelete(counter.id)}
                    >
                      <TrashIcon className="h-5 w-5 inline" />
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-8 text-center text-sky-600">
                  No counters found. Create your first counter!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Pagination Controls */}
      {counters.length > 0 && (
        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-sky-600">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, counters.length)} of{" "}
            {counters.length} entries
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              size="sm"
              variant="secondary"
            >
              Previous
            </Button>
            {[...Array(totalPages)].map((_, index) => (
              <Button
                key={index + 1}
                onClick={() => setCurrentPage(index + 1)}
                size="sm"
                variant={currentPage === index + 1 ? "primary" : "secondary"}
              >
                {index + 1}
              </Button>
            ))}
            <Button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              size="sm"
              variant="secondary"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
