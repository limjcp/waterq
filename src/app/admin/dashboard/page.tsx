"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  UsersIcon,
  ChartBarIcon,
  QueueListIcon,
  BuildingStorefrontIcon,
} from "@heroicons/react/24/outline";

export default function Dashboard() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="animate-spin h-8 w-8 border-4 border-sky-500 border-t-transparent rounded-full mx-auto"></div>
    );
  }

  return (
    <div className="max-w-10xl mx-auto bg-white rounded-2xl shadow-2xl p-8">
      <h1 className="text-3xl font-bold text-sky-800 mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Summary Cards */}
        <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-sky-500 rounded-lg">
              <UsersIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-sky-800">
                Staff Management
              </h2>
              <p className="text-sky-600">Manage staff accounts and roles</p>
            </div>
          </div>
          <Link
            href="/admin/users"
            className="mt-4 inline-block text-sky-600 hover:text-sky-800"
          >
            View Staff &rarr;
          </Link>
        </div>

        <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-sky-500 rounded-lg">
              <QueueListIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-sky-800">Services</h2>
              <p className="text-sky-600">Manage service types and options</p>
            </div>
          </div>
          <Link
            href="/admin/services"
            className="mt-4 inline-block text-sky-600 hover:text-sky-800"
          >
            View Services &rarr;
          </Link>
        </div>

        <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-sky-500 rounded-lg">
              <BuildingStorefrontIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-sky-800">Counters</h2>
              <p className="text-sky-600">Set up service counters</p>
            </div>
          </div>
          <Link
            href="/admin/counters"
            className="mt-4 inline-block text-sky-600 hover:text-sky-800"
          >
            Manage Counters &rarr;
          </Link>
        </div>

        <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl shadow-lg p-6">
          <div className="flex items-center">
            <div className="p-3 bg-sky-500 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-sky-800">Reports</h2>
              <p className="text-sky-600">View and export performance data</p>
            </div>
          </div>
          <Link
            href="/admin/report"
            className="mt-4 inline-block text-sky-600 hover:text-sky-800"
          >
            View Reports &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
