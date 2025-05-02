"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import {
  ChartBarIcon,
  UsersIcon,
  HomeIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";

export default function SupervisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] =
    useState(false);
  const [
    supervisedService,
    setSupervisedService,
  ] = useState<{
    name: string;
    code: string;
  } | null>(null);

  useEffect(() => {
    if (
      status === "authenticated" &&
      session?.user?.supervisedService
    ) {
      setSupervisedService(
        session.user.supervisedService
      );
    }
  }, [session, status]);

  // Close sidebar when route changes (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Navigation items with icons and active states
  const navigation = [
    {
      name: "Dashboard",
      href: "/supervisor",
      icon: HomeIcon,
      current: pathname === "/supervisor",
    },
    {
      name: "Staff Management",
      href: "/supervisor/user",
      icon: UsersIcon,
      current: pathname === "/supervisor/user",
    },
    {
      name: "Reports",
      href: "/supervisor/report",
      icon: ChartBarIcon,
      current: pathname === "/supervisor/report",
    },
  ];

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-sky-100 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-sky-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-sky-100 p-8">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl p-8 text-center">
          <h1 className="text-3xl font-bold text-sky-800 mb-6">
            Supervisor Access
          </h1>
          <p className="text-xl text-red-500">
            Please log in to access this area.
          </p>
          <div className="mt-8">
            <Link
              href="/auth/login"
              className="px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
            >
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (
    !session?.user?.role?.includes("supervisor")
  ) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-sky-100 p-8">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-2xl p-8 text-center">
          <h1 className="text-3xl font-bold text-sky-800 mb-6">
            Unauthorized Access
          </h1>
          <p className="text-xl text-red-500">
            You don't have supervisor privileges.
          </p>
          <div className="mt-8">
            <Link
              href="/"
              className="px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gradient-to-br from-sky-50 to-sky-100">
      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed inset-0 flex z-40">
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <div
          className={`fixed inset-0 flex z-40 transform ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full"
          } transition-all ease-in-out duration-300`}
        >
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-xl">
            {/* Close button */}
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() =>
                  setSidebarOpen(false)
                }
              >
                <XMarkIcon className="h-6 w-6 text-white" />
              </button>
            </div>

            {/* Mobile sidebar content */}
            {renderSidebarContent()}
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64 border-r border-sky-100 bg-white shadow-lg">
          {renderSidebarContent()}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {/* Top navbar */}
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow-sm">
          <button
            className="px-4 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6 text-sky-700" />
          </button>
          <div className="flex-1 px-4 flex justify-between items-center">
            <div>
              <h1 className="text-xl font-semibold text-sky-800">
                Supervisor Portal
                {supervisedService && (
                  <span className="ml-2 text-sm text-sky-600 font-normal">
                    {supervisedService.name} (
                    {supervisedService.code})
                  </span>
                )}
              </h1>
            </div>

            {/* User menu */}
            <div className="ml-4 flex items-center md:ml-6">
              <div className="flex items-center">
                <div className="hidden md:block mr-4 text-right">
                  <div className="text-sm font-medium text-gray-700">
                    {session.user.name}
                  </div>
                  <div className="text-xs font-medium text-gray-500">
                    {session.user.role?.includes(
                      "supervisor"
                    )
                      ? "Supervisor"
                      : ""}
                  </div>
                </div>

                <button
                  onClick={() => signOut()}
                  className="flex items-center text-sm px-3 py-2 rounded-md text-sky-800 hover:bg-sky-100"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5 mr-1" />
                  <span className="hidden md:inline">
                    Sign out
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative z-0 overflow-y-auto p-1 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );

  // Helper function to render sidebar content (used by both mobile and desktop)
  function renderSidebarContent() {
    return (
      <div className="h-0 flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
        {/* Logo */}
        <div className="flex-shrink-0 flex items-center px-4 mb-5">
          <Link
            href="/"
            className="flex items-center"
          >
            <div className="h-8 w-8 bg-sky-600 rounded-md flex items-center justify-center">
              <span className="text-white font-bold">
                W
              </span>
            </div>
            <span className="ml-2 text-xl font-bold text-sky-800">
              WaterQ
            </span>
          </Link>
        </div>

        {/* User profile in sidebar */}
        <div className="px-4 mb-6">
          <div className="p-3 bg-sky-50 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserCircleIcon className="h-10 w-10 text-sky-600" />
              </div>
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {session?.user?.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  Supervisor
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-1 flex-1 px-2 space-y-1">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`${
                item.current
                  ? "bg-sky-100 text-sky-800"
                  : "text-gray-700 hover:bg-sky-50"
              } group flex items-center px-3 py-3 text-sm font-medium rounded-md`}
              aria-current={
                item.current ? "page" : undefined
              }
            >
              <item.icon
                className={`mr-3 flex-shrink-0 h-5 w-5 ${
                  item.current
                    ? "text-sky-600"
                    : "text-gray-500"
                }`}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Support info */}
        <div className="px-4 mt-6">
          <div className="p-3 bg-sky-50 rounded-lg">
            <h3 className="text-xs font-semibold text-sky-800 uppercase tracking-wider">
              Need help?
            </h3>
            <p className="mt-1 text-xs text-gray-600">
              Contact IT support at <br />
              <a
                href="mailto:support@waterq.com"
                className="text-sky-600 hover:underline"
              >
                support@waterq.com
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }
}
