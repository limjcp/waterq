"use client";

import { useState, useEffect } from "react";

type User = {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  username: string;
  role: string[];
  assignedCounterId?: string;
};

type Counter = {
  id: string;
  name: string;
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [counters, setCounters] = useState<Counter[]>([]);
  const [error, setError] = useState("");
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({
    password: "",
    assignedCounterId: "",
  });

  useEffect(() => {
    fetchUsers();
    fetchCounters();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      const data = await response.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchCounters = async () => {
    try {
      const response = await fetch("/api/counters");
      const data = await response.json();
      setCounters(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        setError(data.error || "Something went wrong");
      } else {
        setEditUserId(null);
        setEditFormData({ password: "", assignedCounterId: "" });
        fetchUsers();
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleArchive = async (userId: string) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        setError("Something went wrong");
      } else {
        fetchUsers();
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-4xl font-bold mb-8">Registered Users</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <ul className="w-full max-w-md bg-white p-8 rounded shadow-md mt-4">
        {users.map((user) => (
          <li key={user.id} className="mb-4">
            <p className="text-gray-700">
              {user.firstName} {user.middleName} {user.lastName}
            </p>
            <p className="text-gray-500">{user.email}</p>
            <p className="text-gray-500">{user.username}</p>
            <p className="text-gray-500">Role: {user.role.join(", ")}</p>
            <p className="text-gray-500">
              {user.assignedCounterId
                ? `Assigned Counter: ${
                    counters.find(
                      (counter) => counter.id === user.assignedCounterId
                    )?.name
                  }`
                : "Not assigned to a counter"}
            </p>
            {editUserId === user.id ? (
              <form onSubmit={handleEditSubmit} className="mt-4">
                <div className="mb-4">
                  <label className="block text-gray-700">New Password</label>
                  <input
                    name="password"
                    type="password"
                    value={editFormData.password}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border rounded"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-gray-700">
                    Assigned Counter
                  </label>
                  <select
                    name="assignedCounterId"
                    value={editFormData.assignedCounterId}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border rounded"
                  >
                    <option value="">Select Counter</option>
                    {counters.map((counter) => (
                      <option key={counter.id} value={counter.id}>
                        {counter.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditUserId(null)}
                  className="bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600 ml-2"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <div className="mt-4">
                <button
                  onClick={() => setEditUserId(user.id)}
                  className="bg-yellow-500 text-white py-2 px-4 rounded hover:bg-yellow-600"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleArchive(user.id)}
                  className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 ml-2"
                >
                  Archive
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
