"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { LockClosedIcon, UserCircleIcon } from "@heroicons/react/24/outline";

export default function SigninPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await signIn("credentials", {
      ...formData,
      redirect: false,
    });

    if (result?.error) {
      setError(result.error);
      setError("Invalid Username or Password. Please try again.");
      setIsLoading(false);
    } else {
      router.push("/");
    }
  };

  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-center p-6"
      style={{ backgroundImage: "url('/WD.png')" }}
    >
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl p-8 flex transition-all duration-300 hover:shadow-2xl">
        {/* Left Side - Logo Box */}
        <div className="hidden md:flex flex-col items-center justify-center w-5/3 bg-sky-100 rounded-l-2xl p-6">
          <img src="/wdmascot.png" alt="Logo" className="w-60 h-50 mb-7" />
          <h2 className="text-xl font-bold text-sky-800">Welcome back!</h2>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full md:w-2/3 p-8">
          <div className="text-center mb-8">
            <img
              src="/wdlogo.png"
              alt="Logo"
              className="h-36 w-36 mx-auto mb-4"
            />

            <h1 className="text-3xl font-bold text-sky-800 mb-2">Login</h1>
            <p className="text-sky-600"></p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-sky-700 mb-2">
                Username
              </label>
              <div className="relative">
                <input
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all pl-12"
                  placeholder="Enter your username"
                  autoComplete="username"
                />
                <UserCircleIcon className="h-5 w-5 text-sky-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-sky-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 outline-none transition-all pl-12"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <LockClosedIcon className="h-5 w-5 text-sky-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-sky-500 hover:bg-sky-600 text-white font-medium py-3 px-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
            >
              {isLoading ? (
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
