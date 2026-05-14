import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = (req.auth?.user as any)?.role;

  // 1. Define Route Categories
  const isApiAuthRoute = nextUrl.pathname.startsWith("/api/auth");
  const isApiRoute = nextUrl.pathname.startsWith("/api");
  const isPublicRoute = ["/login", "/register", "/"].includes(nextUrl.pathname);
  
  // Dashboard routes
  const isPatientRoute = nextUrl.pathname.startsWith("/patient");
  const isDoctorRoute = nextUrl.pathname.startsWith("/doctor");
  const isReceptionRoute = nextUrl.pathname.startsWith("/reception");
  const isAdminRoute = nextUrl.pathname.startsWith("/admin");

  // 2. Allow API Auth routes always
  if (isApiAuthRoute) return NextResponse.next();

  // 3. Handle Public Routes
  if (isPublicRoute) {
    if (isLoggedIn && role) {
      // Redirect to respective dashboard if already logged in
      return NextResponse.redirect(new URL(`/${role.toLowerCase()}/dashboard`, nextUrl));
    }
    return NextResponse.next();
  }

  // 4. Force Login for all other routes
  if (!isLoggedIn) {
    // If it's an API route, return 401 instead of redirect
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // 5. RBAC Enforcement (Route Protection)
  if (isPatientRoute && role !== "PATIENT") {
    return NextResponse.redirect(new URL("/unauthorized", nextUrl));
  }
  
  if (isDoctorRoute && role !== "DOCTOR") {
    return NextResponse.redirect(new URL("/unauthorized", nextUrl));
  }

  if (isReceptionRoute && role !== "RECEPTION") {
    return NextResponse.redirect(new URL("/unauthorized", nextUrl));
  }

  if (isAdminRoute && role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.redirect(new URL("/unauthorized", nextUrl));
  }

  return NextResponse.next();
});

// Matcher covers all dashboard and api routes, excludes static assets
export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
