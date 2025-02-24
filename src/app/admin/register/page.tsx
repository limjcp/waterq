"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
    role: "admin", // default role set to admin
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
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
        setError(data.error || "Something went wrong");
      } else {
        setSuccess("Registration successful");
        router.push("/api/auth/signin"); // Redirect after successful registration
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-center p-6"
      style={{ backgroundImage: "url('/WD.png')" }}
    >
      <div className="max-w-4xl max-sm:max-w-lg w-full mx-auto font-sans p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center mb-12 sm:mb-16">
          <h4 className="text-gray-600 text-base font-bold mt-6">
            Register User
          </h4>
        </div>
        <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="text-gray-600 text-sm mb-2 block">
              First Name
            </label>
            <input
              name="firstName"
              type="text"
              value={formData.firstName}
              onChange={handleChange}
              className="bg-gray-100 w-full text-gray-800 text-sm px-4 py-3 rounded focus:bg-transparent outline-blue-500 transition-all"
              placeholder="Enter first name"
              required
            />
          </div>
          <div>
            <label className="text-gray-600 text-sm mb-2 block">
              Middle Name
            </label>
            <input
              name="middleName"
              type="text"
              value={formData.middleName}
              onChange={handleChange}
              className="bg-gray-100 w-full text-gray-800 text-sm px-4 py-3 rounded focus:bg-transparent outline-blue-500 transition-all"
              placeholder="Enter middle name"
            />
          </div>
          <div>
            <label className="text-gray-600 text-sm mb-2 block">
              Last Name
            </label>
            <input
              name="lastName"
              type="text"
              value={formData.lastName}
              onChange={handleChange}
              className="bg-gray-100 w-full text-gray-800 text-sm px-4 py-3 rounded focus:bg-transparent outline-blue-500 transition-all"
              placeholder="Enter last name"
              required
            />
          </div>
          <div>
            <label className="text-gray-600 text-sm mb-2 block">Email</label>
            <input
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="bg-gray-100 w-full text-gray-800 text-sm px-4 py-3 rounded focus:bg-transparent outline-blue-500 transition-all"
              placeholder="Enter email"
              required
            />
          </div>
          <div>
            <label className="text-gray-600 text-sm mb-2 block">Username</label>
            <input
              name="username"
              type="text"
              value={formData.username}
              onChange={handleChange}
              className="bg-gray-100 w-full text-gray-800 text-sm px-4 py-3 rounded focus:bg-transparent outline-blue-500 transition-all"
              placeholder="Enter username"
              required
            />
          </div>
          <div>
            <label className="text-gray-600 text-sm mb-2 block">Password</label>
            <input
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              className="bg-gray-100 w-full text-gray-800 text-sm px-4 py-3 rounded focus:bg-transparent outline-blue-500 transition-all"
              placeholder="Enter password"
              required
            />
          </div>
          <div className="sm:col-span-2 mt-8">
            <button
              type="submit"
              className="mx-auto block py-3 px-6 text-sm font-bold tracking-wider rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
            >
              Register
            </button>
          </div>
        </form>
        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
        {success && <p className="text-green-500 text-sm mt-4">{success}</p>}
      </div>
    </div>
  );
}
