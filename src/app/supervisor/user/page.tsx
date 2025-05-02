"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  PencilIcon,
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

export default function SupervisorUserManagement() {
  const { data: session, status } = useSession();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [counters, setCounters] = useState<
    Counter[]
  >([]);
  const [serviceName, setServiceName] =
    useState("");
  const [serviceId, setServiceId] = useState<
    string | null
  >(null);
  const [editUserId, setEditUserId] = useState<
    string | null
  >(null);
  const [editFormData, setEditFormData] =
    useState({
      password: "",
      assignedCounterId: "",
    });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [
    isRegisterModalOpen,
    setIsRegisterModalOpen,
  ] = useState(false);
  const [registerFormData, setRegisterFormData] =
    useState({
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      username: "",
      password: "",
      role: "staff",
    });
  const [registerLoading, setRegisterLoading] =
    useState(false);
  const [currentPage, setCurrentPage] =
    useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (
      status === "authenticated" &&
      session?.user
    ) {
      // Extract supervisedService directly from session if available
      if (session.user.supervisedService) {
        const serviceData =
          session.user.supervisedService;
        setServiceId(serviceData.id);
        setServiceName(serviceData.name);

        // Then fetch users and counters for that service
        Promise.all([
          fetchUsers(serviceData.id),
          fetchCounters(serviceData.id),
        ]).then(() => setLoading(false));
      } else {
        // Fall back to API call if not available in session
        fetchSupervisedService().then(
          (serviceData) => {
            if (serviceData) {
              setServiceId(serviceData.id);
              setServiceName(serviceData.name);

              Promise.all([
                fetchUsers(serviceData.id),
                fetchCounters(serviceData.id),
              ]).then(() => setLoading(false));
            } else {
              setLoading(false);
            }
          }
        );
      }
    } else if (status === "unauthenticated") {
      setLoading(false);
    }
  }, [status, session]);

  const fetchSupervisedService = async () => {
    try {
      const response = await fetch(
        `/api/supervisor/service`
      );
      if (!response.ok)
        throw new Error(
          "Failed to fetch supervised service"
        );
      return await response.json();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch supervised service"
      );
      return null;
    }
  };

  const fetchUsers = async (id) => {
    try {
      const response = await fetch(
        `/api/supervisor/users?serviceId=${id}`
      );
      if (!response.ok)
        throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch users"
      );
    }
  };

  const fetchCounters = async (id) => {
    try {
      const response = await fetch(
        `/api/supervisor/counters?serviceId=${id}`
      );
      if (!response.ok)
        throw new Error(
          "Failed to fetch counters"
        );
      const data = await response.json();
      setCounters(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch counters"
      );
    }
  };

  const fetchServiceDetails = async () => {
    if (!serviceId) return;

    try {
      const response = await fetch(
        `/api/service/${serviceId}`
      );
      if (!response.ok)
        throw new Error(
          "Failed to fetch service details"
        );
      const data = await response.json();
      setServiceName(data.name);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch service details"
      );
    }
  };

  const handleEditChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleEditSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        `/api/users/${editUserId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editFormData),
        }
      );

      const data = await response.json();
      if (!response.ok) {
        setError(
          data.error ||
            "Something went wrong while updating user"
        );
      } else {
        setSuccess("User updated successfully!");
        setEditUserId(null);
        setEditFormData({
          password: "",
          assignedCounterId: "",
        });
        fetchUsers();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update user"
      );
    }
  };

  const handleRegisterChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) => {
    setRegisterFormData({
      ...registerFormData,
      [e.target.name]: e.target.value,
    });
  };

  const handleRegisterSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setRegisterLoading(true);

    try {
      const response = await fetch(
        "/api/supervisor/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...registerFormData,
            serviceId: serviceId,
          }),
        }
      );

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
        fetchUsers();
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to register user"
      );
    } finally {
      setRegisterLoading(false);
    }
  };

  const paginatedUsers = users.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setTotalPages(
      Math.ceil(users.length / itemsPerPage)
    );
  }, [users]);

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
            User Management
          </h1>
          <p className="text-xl text-red-500">
            Please log in to access this page.
          </p>
        </div>
      </div>
    );
  }

  if (!serviceId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-sky-100 p-8">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl p-8 text-center">
          <h1 className="text-3xl font-bold text-sky-800 mb-6">
            User Management
          </h1>
          <p className="text-xl text-red-500">
            No service selected. Please return to
            the dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-sky-50 to-sky-100 min-h-screen">
      <div className="max-w-7xl mx-auto p-8">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-sky-800">
              {serviceName} - Staff Management
            </h1>
            <Button
              onClick={() =>
                setIsRegisterModalOpen(true)
              }
              variant="primary"
              size="md"
            >
              <UserPlusIcon className="h-5 w-5 mr-2" />
              Register New Staff
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
              <h2 className="text-xl font-semibold text-sky-700 mb-4">
                Edit User
              </h2>
              <form
                onSubmit={handleEditSubmit}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-sky-700 mb-2">
                      New Password (leave empty to
                      keep current)
                    </label>
                    <input
                      name="password"
                      type="password"
                      value={
                        editFormData.password
                      }
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
                      value={
                        editFormData.assignedCounterId
                      }
                      onChange={handleEditChange}
                      className="w-full px-4 py-2 border border-sky-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                      aria-label="Assign counter to user"
                    >
                      <option value="">
                        None (Unassign)
                      </option>
                      {counters.map((counter) => (
                        <option
                          key={counter.id}
                          value={counter.id}
                        >
                          {counter.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-2">
                  <Button
                    type="button"
                    onClick={() =>
                      setEditUserId(null)
                    }
                    size="md"
                    variant="danger"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    onClick={handleEditSubmit}
                    size="md"
                    variant="success"
                  >
                    Update User
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Users Table */}
          <div className="overflow-x-auto flex flex-col justify-between h-[79vh]">
            <div>
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
                    <th className="py-3 px-4 text-left font-medium text-sky-700 border-b">
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
                          {user.middleName
                            ? user.middleName +
                              " "
                            : ""}
                          {user.lastName}
                        </td>
                        <td className="py-3 px-4">
                          {user.username}
                        </td>
                        <td className="py-3 px-4">
                          {user.email}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {user.role.map(
                              (role) => (
                                <span
                                  key={role}
                                  className={`text-xs px-2 py-1 rounded-full ${
                                    role ===
                                    "admin"
                                      ? "bg-purple-100 text-purple-800"
                                      : role ===
                                        "staff"
                                      ? "bg-blue-100 text-blue-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {role}
                                </span>
                              )
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {user.assignedCounter
                            ?.name || "None"}
                        </td>
                        <td className="flex flex-row gap-1 py-3 px-4 text-right">
                          <Button
                            variant="primary"
                            onClick={() =>
                              setEditUserId(
                                user.id
                              )
                            }
                          >
                            <PencilIcon className="h-5 w-5 inline" />
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={6}
                        className="py-8 text-center text-sky-600"
                      >
                        No users found. Register
                        your first staff member!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {users.length > 0 && (
              <div className="mt-6 flex justify-between items-center">
                <div className="text-sm text-sky-600">
                  Showing{" "}
                  {(currentPage - 1) *
                    itemsPerPage +
                    1}{" "}
                  to{" "}
                  {Math.min(
                    currentPage * itemsPerPage,
                    users.length
                  )}{" "}
                  of {users.length} entries
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() =>
                      setCurrentPage((prev) =>
                        Math.max(prev - 1, 1)
                      )
                    }
                    disabled={currentPage === 1}
                    size="sm"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() =>
                      setCurrentPage((prev) =>
                        Math.min(
                          prev + 1,
                          totalPages
                        )
                      )
                    }
                    disabled={
                      currentPage === totalPages
                    }
                    size="sm"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Registration Modal */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl w-full max-h-[100vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center">
                <UserPlusIcon className="h-8 w-8 text-sky-600 mr-3" />
                <h2 className="text-3xl font-bold text-sky-800">
                  Register New Staff
                </h2>
              </div>
              <Button
                onClick={() =>
                  setIsRegisterModalOpen(false)
                }
                size="sm"
                variant="danger"
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

            <form
              onSubmit={handleRegisterSubmit}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-sky-700 mb-2">
                    First Name
                  </label>
                  <input
                    name="firstName"
                    value={
                      registerFormData.firstName
                    }
                    onChange={
                      handleRegisterChange
                    }
                    required
                    placeholder="Enter first name"
                    className="w-full px-4 py-2 border border-sky-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-sky-700 mb-2">
                    Middle Name{" "}
                    <span className="text-gray-400 text-xs">
                      (optional)
                    </span>
                  </label>
                  <input
                    name="middleName"
                    value={
                      registerFormData.middleName
                    }
                    onChange={
                      handleRegisterChange
                    }
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
                    value={
                      registerFormData.lastName
                    }
                    onChange={
                      handleRegisterChange
                    }
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
                    onChange={
                      handleRegisterChange
                    }
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
                    value={
                      registerFormData.username
                    }
                    onChange={
                      handleRegisterChange
                    }
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
                    value={
                      registerFormData.password
                    }
                    onChange={
                      handleRegisterChange
                    }
                    required
                    placeholder="Create a strong password"
                    className="w-full px-4 py-2 border border-sky-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  onClick={() =>
                    setIsRegisterModalOpen(false)
                  }
                  size="md"
                  variant="danger"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  onClick={handleRegisterSubmit}
                  disabled={registerLoading}
                  size="md"
                  variant="success"
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
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
