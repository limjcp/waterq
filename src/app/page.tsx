import { auth } from "@/auth";
import Link from "next/link";
import React from "react";
import {
  UserCircleIcon,
  ArrowRightCircleIcon,
  FingerPrintIcon,
} from "@heroicons/react/24/outline";

export default async function UserPage() {
  const session = await auth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-sky-100 flex flex-col items-center justify-center p-6">
      {session ? (
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl p-8 transition-all duration-300 hover:shadow-2xl">
          <div className="text-center mb-8">
            <UserCircleIcon className="h-16 w-16 text-sky-500 mx-auto mb-4" />
            <h1 className="text-4xl font-bold text-sky-800 mb-2">
              Welcome, {session.user?.firstName || session.user?.username}!
            </h1>
            <p className="text-sky-600">You are successfully authenticated</p>
          </div>

          <div className="bg-sky-50 rounded-xl p-6 border border-sky-100">
            <h2 className="text-lg font-semibold text-sky-700 mb-4">
              Session Details
            </h2>
            <pre className="text-sm font-mono text-sky-800 bg-white p-4 rounded-lg overflow-x-auto">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>

          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/api/auth/signout"
              className="px-6 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors duration-200 flex items-center"
            >
              <ArrowRightCircleIcon className="w-5 h-5 mr-2" />
              Sign Out
            </Link>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
          <FingerPrintIcon className="h-16 w-16 text-sky-500 mx-auto mb-6" />
          <h2 className="text-3xl font-bold text-sky-800 mb-2">
            Access Required
          </h2>
          <p className="text-sky-600 mb-8">Please authenticate to continue</p>

          <div className="space-y-4">
            <Link
              href="/kiosk"
              className="block px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg transition-colors duration-200 font-medium"
            >
              Public Kiosk Access
            </Link>

            <Link
              href="/api/auth/signin"
              className="block px-6 py-3 border-2 border-sky-500 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors duration-200 font-medium"
            >
              <div className="flex items-center justify-center">
                <UserCircleIcon className="w-5 h-5 mr-2" />
                Staff/Admin Login
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
