"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  PencilIcon,
  TrashIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import Button from "@/components/Button";

type User = {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  username: string;
  role: string[];
  assignedCounter?: {
    name: string;
  };
};

type Counter = {
  id: string;
  name: string;
};

export default function UsersPage() {
  const { status } = useSession();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [counters, setCounters] = useState<Counter[]>([]);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    password: "",
    assignedCounterId: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [registerFormData, setRegisterFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
    role: "staff",
  });
  const [registerLoading, setRegisterLoading] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (status === "authenticated") {
      fetchUsers();
      fetchCounters();
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/users");
      const data = await response.json();
      setUsers(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const fetchCounters = async () => {
    try {
      const response = await fetch("/api/counters");
      const data = await response.json();
      setCounters(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch counters");
    }
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/users/${editUserId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editFormData),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Something went wrong while updating user");
      } else {
        setSuccess("User updated successfully!");
        setEditUserId(null);
        setEditFormData({ password: "", assignedCounterId: "" });
        fetchUsers();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update user");
    }
  };

  const handleArchive = async (userId: string) => {
    if (!confirm("Are you sure you want to archive this user?")) return;

    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        setError("Something went wrong while archiving the user");
      } else {
        setSuccess("User archived successfully!");
        fetchUsers();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to archive user");
    }
  };

  const handleRegisterChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setRegisterFormData({
      ...registerFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setRegisterLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registerFormData),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(
          data.error ||
          "Registration failed. Please check your information and try again."
        );
      } else {
        setSuccess(
          "Registration successful! The new staff member can now login."
        );
        setRegisterFormData({
          firstName: "",
          middleName: "",
          lastName: "",
          email: "",
          username: "",
          password: "",
          role: "staff",
        });
        setIsRegisterModalOpen(false);
        fetchUsers(); // Refresh the users list
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to register user");
    } finally {
      setRegisterLoading(false);
    }
  };

  const paginatedUsers = users.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setTotalPages(Math.ceil(users.length / itemsPerPage));
  }, [users]);

  if (status === "loading" || loading) {
    return (
      <div className="animate-spin h-8 w-8 border-4 border-sky-500 border-t-transparent rounded-full mx-auto"></div>
    );
  }

  return (
    <div className="max-w-10xl mx-auto bg-white rounded-2xl shadow-2xl p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-sky-800">Staff Management</h1>
        <Button onClick={() => setIsRegisterModalOpen(true)} variant="primary" size={10}>
          <UserPlusIcon className="h-5 w-5 mr-2" />
          Register New Staff 11
        </Button>
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

      {/* Edit User Form */}
      {editUserId && (
        <div className="mb-8 bg-sky-50 p-6 rounded-xl border border-sky-100">
          <h2 className="text-xl font-semibold text-sky-700 mb-4">Edit User</h2>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-sky-700 mb-2">
                  New Password (leave empty to keep current)
                </label>
                <input
                  name="password"
                  type="password"
                  value={editFormData.password}
                  onChange={handleEditChange}
                  placeholder="Enter new password"
                  className="w-full px-4 py-2 border border-sky-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-sky-700 mb-2">
                  Assigned Counter
                </label>
                <select
                  name="assignedCounterId"
                  value={editFormData.assignedCounterId}
                  onChange={handleEditChange}
                  className="w-full px-4 py-2 border border-sky-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  aria-label="Assign counter to user"
                >
                  <option value="">None (Unassign)</option>
                  {counters.map((counter) => (
                    <option key={counter.id} value={counter.id}>
                      {counter.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-2">
              <button
                type="button"
                onClick={() => setEditUserId(null)}
                className="px-4 py-2 text-sky-600 hover:text-sky-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg"
              >
                Update User
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Registration Modal */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <UserPlusIcon className="h-8 w-8 text-sky-600 mr-3" />
                <h2 className="text-3xl font-bold text-sky-800">
                  Register New Staff
                </h2>
              </div>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close registration modal"
              >
                <svg
                  className="h-6 w-6"
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

            <form onSubmit={handleRegisterSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-sky-700 mb-2">
                    First Name
                  </label>
                  <input
                    name="firstName"
                    value={registerFormData.firstName}
                    onChange={handleRegisterChange}
                    required
                    placeholder="Enter first name"
                    className="w-full px-4 py-2 border border-sky-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-sky-700 mb-2">
                    Middle Name{" "}
                    <span className="text-gray-400 text-xs">(optional)</span>
                  </label>
                  <input
                    name="middleName"
                    value={registerFormData.middleName}
                    onChange={handleRegisterChange}
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
                    value={registerFormData.lastName}
                    onChange={handleRegisterChange}
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
                    value={registerFormData.email}
                    onChange={handleRegisterChange}
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
                    value={registerFormData.username}
                    onChange={handleRegisterChange}
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
                    value={registerFormData.password}
                    onChange={handleRegisterChange}
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
                    value={registerFormData.role}
                    onChange={handleRegisterChange}
                    className="w-full px-4 py-2 border border-sky-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                    aria-label="Select staff role"
                  >
                    <option value="admin">Admin</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 text-sky-600 hover:text-sky-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registerLoading}
                  className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-lg transition-colors flex items-center"
                >
                  {registerLoading ? (
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
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-sky-100">
          <thead>
            <tr className="bg-sky-50">
              <th className="py-3 px-4 text-left font-medium text-sky-700 border-b">
                Name
              </th>
              <th className="py-3 px-4 text-left font-medium text-sky-700 border-b">
                Username
              </th>
              <th className="py-3 px-4 text-left font-medium text-sky-700 border-b">
                Email
              </th>
              <th className="py-3 px-4 text-left font-medium text-sky-700 border-b">
                Role
              </th>
              <th className="py-3 px-4 text-left font-medium text-sky-700 border-b">
                Assigned Counter
              </th>
              <th className="py-3 px-4 text-right font-medium text-sky-700 border-b">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.length > 0 ? (
              paginatedUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-sky-50 hover:bg-sky-50"
                >
                  <td className="py-3 px-4">
                    {user.firstName}{" "}
                    {user.middleName ? user.middleName + " " : ""}
                    {user.lastName}
                  </td>
                  <td className="py-3 px-4">{user.username}</td>
                  <td className="py-3 px-4">{user.email}</td>
                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {user.role.map((role) => (
                        <span
                          key={role}
                          className={`text-xs px-2 py-1 rounded-full ${role === "admin"
                            ? "bg-purple-100 text-purple-800"
                            : role === "staff"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                            }`}
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    {user.assignedCounter?.name || "None"}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setEditUserId(user.id)}
                      className="text-blue-500 hover:text-blue-700 mr-2"
                      title="Edit User"
                    >
                      <PencilIcon className="h-5 w-5 inline" />
                    </button>
                    <button
                      onClick={() => handleArchive(user.id)}
                      className="text-red-500 hover:text-red-700"
                      title="Archive User"
                    >
                      <TrashIcon className="h-5 w-5 inline" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="py-8 text-center text-sky-600">
                  No users found. Register your first staff member!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Pagination Controls */}
      {users.length > 0 && (
        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-sky-600">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, users.length)} of{" "}
            {users.length} entries
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-lg border border-sky-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-sky-50"
            >
              Previous
            </button>
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index + 1}
                onClick={() => setCurrentPage(index + 1)}
                className={`px-3 py-1 rounded-lg border ${currentPage === index + 1
                  ? "bg-sky-500 text-white"
                  : "border-sky-200 hover:bg-sky-50"
                  }`}
              >
                {index + 1}
              </button>
            ))}
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-lg border border-sky-200 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-sky-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
