import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  console.log("isLoggedIn:", isLoggedIn);
  console.log("req.auth:", req.auth);

  // Public routes that don't require authentication
  if (
    nextUrl.pathname.startsWith("/api/auth") ||
    nextUrl.pathname === "/WD.png" ||
    nextUrl.pathname === "/wdmascot.png" ||
    nextUrl.pathname === "/wdlogo.png" ||
    nextUrl.pathname === "/file.svg" ||
    nextUrl.pathname.startsWith("/kiosk") ||
    nextUrl.pathname.startsWith("/auth/signin") ||
    nextUrl.pathname.startsWith("/api/tickets") ||
    nextUrl.pathname.startsWith("/display") ||
    nextUrl.pathname.startsWith("/api/display") ||
    nextUrl.pathname === "/admin/register"
  ) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login page
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/auth/signin", nextUrl));
  }

  // Role-based redirects when accessing the root path "/"
  if (nextUrl.pathname === "/") {
    const user = req.auth.user;

    // For admin users, redirect to admin dashboard
    if (user.role && Array.isArray(user.role) && user.role.includes("admin")) {
      console.log("Redirecting admin user to /admin/dashboard");
      return NextResponse.redirect(new URL("/admin/dashboard", nextUrl));
    }

    // For staff users, check the assigned counter and redirect accordingly
    if (user.role && Array.isArray(user.role) && user.role.includes("staff")) {
      const counterDashboardMap: Record<string, string> = {
        "Customer Welfare Counter": "/staff/customerWelfare",
        "New Service Application Counter": "/staff/newServiceApplication",
        "Payment Counter": "/staff/payment",
      };

      const assignedCounterName = user.assignedCounterName;
      if (assignedCounterName && counterDashboardMap[assignedCounterName]) {
        console.log(
          `Redirecting staff with counter ${assignedCounterName} to ${counterDashboardMap[assignedCounterName]}`
        );
        return NextResponse.redirect(
          new URL(counterDashboardMap[assignedCounterName], nextUrl)
        );
      }

      // Fallback for staff users without a specific counter mapping
      console.log("Redirecting staff user to /staff");
      return NextResponse.redirect(new URL("/staff", nextUrl));
    }
  }

  return NextResponse.next();
});

// Simplified matcher to reduce middleware footprint
export const config = {
  matcher: ["/((?!_next).*)"],
};
