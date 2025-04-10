import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  // console.log("isLoggedIn:", isLoggedIn);
  // console.log("req.auth:", req.auth);

  // Public routes that don't require authentication
  if (
    nextUrl.pathname.startsWith("/api/auth") ||
    nextUrl.pathname.startsWith("/public/upload") ||
    nextUrl.pathname === "/WD.png" ||
    nextUrl.pathname === "/wdmascot.png" ||
    nextUrl.pathname === "/wdlogo.png" ||
    nextUrl.pathname === "/file.svg" ||
    nextUrl.pathname.startsWith("/kiosk") ||
    nextUrl.pathname.startsWith("/auth/signin") ||
    nextUrl.pathname.startsWith("/api/tickets") ||
    nextUrl.pathname.startsWith("/display") ||
    nextUrl.pathname.startsWith("/api/screensaver") ||
    nextUrl.pathname.startsWith("/api/upload") ||
    nextUrl.pathname.startsWith("/api/display") ||
    nextUrl.pathname === "/admin/register" ||
    nextUrl.pathname === "/push.png" ||
    nextUrl.pathname === "/users.png" ||
    nextUrl.pathname.startsWith("/screensaver/") ||  // Add access to screensaver images
    nextUrl.pathname.match(/\.(jpg|jpeg|png|gif|svg)$/) // Allow all image files
  ) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login page
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/auth/signin", nextUrl));
  }

  const user = req.auth?.user;

  // Role-based redirects when accessing the root path "/"
  if (nextUrl.pathname === "/") {
    if (!user) {
      return NextResponse.redirect(new URL("/auth/signin", nextUrl));
    }

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

  // Restrict access to admin routes
  if (
    nextUrl.pathname.startsWith("/admin/") &&
    nextUrl.pathname !== "/admin/register"
  ) {
    if (
      !user?.role ||
      !Array.isArray(user.role) ||
      !user.role.includes("admin")
    ) {
      console.log("Unauthorized access to admin route");
      return NextResponse.redirect(new URL("/", nextUrl));
    }
  }

  // Restrict access to staff routes
  if (nextUrl.pathname.startsWith("/staff/")) {
    if (
      !user?.role ||
      !Array.isArray(user.role) ||
      !user.role.includes("staff")
    ) {
      console.log("Unauthorized access to staff route");
      return NextResponse.redirect(new URL("/", nextUrl));
    }
  }

  return NextResponse.next();
});

// Simplified matcher to reduce middleware footprint
export const config = {
  matcher: ["/((?!_next).*)"],
};
