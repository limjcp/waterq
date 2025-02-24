import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  // Public routes that don't require authentication
  if (
    nextUrl.pathname === "/" ||
    nextUrl.pathname.startsWith("/api/auth") ||
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

  //   // Role-based redirects when accessing the root path "/"
  //   if (nextUrl.pathname === "/") {
  //     const roleDashboardMap: Record<string, string> = {
  //       admin: "/admin-dashboard",
  //       staff: "/staff-approve",
  //       signatory: "/signatory-sign",
  //       student: "/student-dashboard",
  //     };

  //     for (const role of req.auth?.user?.role || []) {
  //       if (roleDashboardMap[role]) {
  //         return NextResponse.redirect(new URL(roleDashboardMap[role], nextUrl));
  //       }
  //     }
  //   }

  //   // Role-specific route protection
  //   const routeRoleMap: Record<string, string> = {
  //     admin: "/admin",
  //     staff: "/staff",
  //     signatory: "/signatory",
  //     student: "/student",
  //   };

  //   for (const role in routeRoleMap) {
  //     if (
  //       nextUrl.pathname.startsWith(routeRoleMap[role]) &&
  //       !req.auth?.user?.role?.includes(role)
  //     ) {
  //       return NextResponse.redirect(new URL("/", nextUrl));
  //     }
  //   }

  return NextResponse.next();
});

// Simplified matcher to reduce middleware footprint
export const config = {
  matcher: ["/((?!_next).*)"],
};
