"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { PlusCircleIcon } from "@heroicons/react/24/outline";

type Service = {
  id: string;
  code: string;
  name: string;
};

export default function RegisterService() {
  const { data: session, status } = useSession();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    code: "",
  });

  useEffect(() => {
    if (status === "authenticated") {
      fetchServices();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/services");
      if (!response.ok) {
        throw new Error("Failed to fetch services");
      }
      const data = await response.json();
      setServices(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create service");
      }

      // Reset form and refresh data
      setFormData({ name: "", code: "" });
      setSuccess("Service created successfully!");
      fetchServices();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="animate-spin h-8 w-8 border-4 border-sky-500 border-t-transparent rounded-full mx-auto"></div>
    );
  }

  return (
    <div className="max-w-10xl mx-auto">
      {/* Service Registration Form */}
      <div className="bg-white rounded-2xl shadow-2xl p-8 mb-8">
        <h1 className="text-3xl font-bold text-sky-800 mb-6">
          Register New Service
        </h1>

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

        <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
          <div>
            <label className="block text-sm font-medium text-sky-700 mb-2">
              Service Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g. Customer Welfare"
              className="w-full px-4 py-2 border border-sky-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-sky-700 mb-2">
              Service Code
            </label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              required
              placeholder="e.g. CW"
              className="w-full px-4 py-2 border border-sky-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <p className="text-xs text-sky-600 mt-1">
              Use short codes like CW for Customer Welfare, NSA for New Service
              Application, P for Payment
            </p>
          </div>

          <div>
            <button
              type="submit"
              className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-lg transition-colors flex items-center"
            >
              <PlusCircleIcon className="h-5 w-5 mr-2" />
              Register Service
            </button>
          </div>
        </form>
      </div>

      {/* Existing Services */}
      <div className="bg-white rounded-2xl shadow-2xl p-8">
        <h2 className="text-2xl font-bold text-sky-800 mb-6">
          Existing Services
        </h2>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-sky-100">
            <thead>
              <tr className="bg-sky-50">
                <th className="py-3 px-4 text-left font-medium text-sky-700 border-b">
                  Service Name
                </th>
                <th className="py-3 px-4 text-left font-medium text-sky-700 border-b">
                  Code
                </th>
              </tr>
            </thead>
            <tbody>
              {services.length > 0 ? (
                services.map((service) => (
                  <tr
                    key={service.id}
                    className="border-b border-sky-50 hover:bg-sky-50"
                  >
                    <td className="py-3 px-4">{service.name}</td>
                    <td className="py-3 px-4">{service.code}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className="py-8 text-center text-sky-600">
                    No services found. Create your first service!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
