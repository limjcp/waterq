"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  UsersIcon,
  ChartBarIcon,
  QueueListIcon,
  HomeIcon,
  BuildingStorefrontIcon,
  ServerStackIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
} from "@heroicons/react/24/outline";
import { useState } from "react";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { status, data: session } = useSession();
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Determine active page based on current pathname
  const getActivePage = () => {
    if (pathname === "/admin/dashboard") return "dashboard";
    if (pathname === "/admin/users") return "users";
    if (pathname === "/admin/register") return "register";
    if (pathname === "/admin/services") return "services";
    if (pathname === "/admin/counters") return "counters";
    if (pathname === "/admin/register-service") return "register-service";
    if (pathname === "/admin/report") return "report";
    return "";
  };

  const activePage = getActivePage();

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-sky-100 p-8 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-sky-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-sky-100 p-8">
        <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl p-8 text-center">
          <h1 className="text-3xl font-bold text-sky-800 mb-6">Admin Area</h1>
          <p className="text-xl text-red-500">
            Please log in to access the admin area.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-sky-100">
      {/* Header */}
      <div
        className={`fixed top-0 right-0 ${
          isSidebarCollapsed ? "left-20" : "left-64"
        } h-16 bg-white shadow-md z-10 flex items-center justify-between px-8 transition-all duration-300`}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-2 hover:bg-sky-100 rounded-lg transition-colors"
            aria-label={
              isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
            }
          >
            <Bars3Icon className="h-6 w-6 text-sky-800" />
          </button>
          <h1 className="text-xl font-semibold text-sky-800">
            General Santos City Water District
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm text-gray-600">Logged in as:</p>
            <p className="font-medium text-sky-800">
              {session?.user?.name || "User"}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-sky-600 flex items-center justify-center text-white font-medium">
            {session?.user?.name
              ?.split(" ")
              .map((n) => n[0])
              .join("") || "U"}
          </div>
        </div>
      </div>
      <div className="flex">
        {/* Sidebar - Fixed position */}
        <div
          className={`fixed ${
            isSidebarCollapsed ? "w-20" : "w-64"
          } bg-sky-800 text-white h-screen p-4 flex flex-col transition-all duration-300`}
        >
          <div className="mb-8 flex justify-center">
            <Image
              src="/wdlogo.png"
              alt="Water District Logo"
              width={64}
              height={64}
              className="h-16 w-auto mx-auto"
            />
            {!isSidebarCollapsed && (
              <h2 className="text-xl font-bold text-center mt-4">
                Admin Panel
              </h2>
            )}
          </div>
          <nav className="flex-1 overflow-y-auto">
            <ul className="space-y-2">
              <li>
                <Link
                  href="/admin/dashboard"
                  className={`flex items-center p-3 rounded-lg ${
                    activePage === "dashboard"
                      ? "bg-sky-700 font-medium"
                      : "hover:bg-sky-700/50"
                  }`}
                  title="Dashboard"
                >
                  <HomeIcon className="h-5 w-5 mr-3" />
                  {!isSidebarCollapsed && "Dashboard"}
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/users"
                  className={`flex items-center p-3 rounded-lg ${
                    activePage === "users"
                      ? "bg-sky-700 font-medium"
                      : "hover:bg-sky-700/50"
                  }`}
                  title="Users"
                >
                  <UsersIcon className="h-5 w-5 mr-3" />
                  {!isSidebarCollapsed && "Users"}
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/services"
                  className={`flex items-center p-3 rounded-lg ${
                    activePage === "services"
                      ? "bg-sky-700 font-medium"
                      : "hover:bg-sky-700/50"
                  }`}
                  title="Service Type"
                >
                  <QueueListIcon className="h-5 w-5 mr-3" />
                  {!isSidebarCollapsed && "Service Type"}
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/counters"
                  className={`flex items-center p-3 rounded-lg ${
                    activePage === "counters"
                      ? "bg-sky-700 font-medium"
                      : "hover:bg-sky-700/50"
                  }`}
                  title="Counters"
                >
                  <BuildingStorefrontIcon className="h-5 w-5 mr-3" />
                  {!isSidebarCollapsed && "Counters"}
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/register-service"
                  className={`flex items-center p-3 rounded-lg ${
                    activePage === "register-service"
                      ? "bg-sky-700 font-medium"
                      : "hover:bg-sky-700/50"
                  }`}
                  title="Register Service"
                >
                  <ServerStackIcon className="h-5 w-5 mr-3" />
                  {!isSidebarCollapsed && "Register Service"}
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/report"
                  className={`flex items-center p-3 rounded-lg ${
                    activePage === "report"
                      ? "bg-sky-700 font-medium"
                      : "hover:bg-sky-700/50"
                  }`}
                  title="Reports"
                >
                  <ChartBarIcon className="h-5 w-5 mr-3" />
                  {!isSidebarCollapsed && "Reports"}
                </Link>
              </li>
            </ul>
          </nav>
          <div className="mt-auto pt-4 border-t border-sky-700">
            <button
              onClick={() => signOut({ callbackUrl: "/auth/signin" })}
              className="flex items-center w-full p-3 rounded-lg text-white hover:bg-sky-700/50 transition-colors"
              title="Sign Out"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
              {!isSidebarCollapsed && "Sign Out"}
            </button>
          </div>
        </div>

        {/* Main Content - With left padding to account for fixed sidebar */}
        <div
          className={`flex-1 ${
            isSidebarCollapsed ? "ml-20" : "ml-64"
          } p-8 mt-16 transition-all duration-300`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
