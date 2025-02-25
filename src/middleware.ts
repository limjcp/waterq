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

    // For staff users, redirect to counter
    if (user.role && Array.isArray(user.role) && user.role.includes("staff")) {
      console.log("Redirecting staff user to /staff/counter");
      return NextResponse.redirect(new URL("/staff/counter", nextUrl));
    }
  }

  return NextResponse.next();
});

// Simplified matcher to reduce middleware footprint
export const config = {
  matcher: ["/((?!_next).*)"],
};
