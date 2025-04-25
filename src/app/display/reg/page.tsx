"use client";

import { useState } from "react";
import { UserPlusIcon } from "@heroicons/react/24/outline";
import Button from "@/components/Button";

export default function RegisterPage() {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
    role: "staff",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Registration failed. Please check your information and try again.");
      } else {
        setSuccess("Registration successful! The new staff member can now login.");
        setFormData({
          firstName: "",
          middleName: "",
          lastName: "",
          email: "",
          username: "",
          password: "",
          role: "staff",
        });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to register user");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-8 mt-8">
      <div className="flex items-center mb-8">
        <UserPlusIcon className="h-8 w-8 text-sky-600 mr-3" />
        <h1 className="text-3xl font-bold text-sky-800">Register New Staff</h1>
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

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-sky-700 mb-2">
              First Name
            </label>
            <input
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              placeholder="Enter first name"
              className="w-full px-4 py-2 border border-sky-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-sky-700 mb-2">
              Middle Name <span className="text-gray-400 text-xs">(optional)</span>
            </label>
            <input
              name="middleName"
              value={formData.middleName}
              onChange={handleChange}
              placeholder="Enter middle name"
              className="w-full px-4 py-2 border border-sky-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-sky-700 mb-2">
              Last Name
            </label>
            <input
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              placeholder="Enter last name"
              className="w-full px-4 py-2 border border-sky-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-sky-700 mb-2">
              Email
            </label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="email@example.com"
              className="w-full px-4 py-2 border border-sky-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-sky-700 mb-2">
              Username
            </label>
            <input
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="Choose a username"
              className="w-full px-4 py-2 border border-sky-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-sky-700 mb-2">
              Password
            </label>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Create a strong password"
              className="w-full px-4 py-2 border border-sky-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-sky-700 mb-2">
              Role
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-sky-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? (
              <>
                <span className="inline-block animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                Registering...
              </>
            ) : (
              <>
                <UserPlusIcon className="h-5 w-5 mr-2" />
                Register New Staff
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}