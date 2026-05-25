import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const accessToken = request.cookies.get("sb-access-token")?.value;
  const userCookie = request.cookies.get("currentUser")?.value;

  let user: { role: string } | null = null;
  if (userCookie && accessToken) {
    try {
      user = JSON.parse(decodeURIComponent(userCookie));
    } catch (e) {
      // Invalid JSON cookie
    }
  }

  const { pathname } = request.nextUrl;

  // Paths requiring authentication
  const isProtectedRoute = 
    pathname.startsWith("/owner") || 
    pathname.startsWith("/accountant") || 
    pathname.startsWith("/invoice");

  // 1. If not authenticated or missing valid tokens, redirect to login page
  if (isProtectedRoute && (!user || !accessToken)) {
    const loginUrl = new URL("/", request.url);
    
    // Clear any partially corrupted session cookies
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("currentUser");
    response.cookies.delete("sb-access-token");
    return response;
  }

  // 2. Role-based routing: Owner vs Accountant separation
  if (user && accessToken) {
    // If authenticated user tries to visit the login page, redirect them to their dashboard
    if (pathname === "/" || pathname === "/login") {
      const targetUrl = new URL(
        user.role === "owner" ? "/owner/dashboard" : "/accountant",
        request.url
      );
      return NextResponse.redirect(targetUrl);
    }

    // Owner cannot access accountant layout/routes
    if (pathname.startsWith("/accountant") && user.role !== "accountant") {
      const targetUrl = new URL("/owner/dashboard", request.url);
      return NextResponse.redirect(targetUrl);
    }

    // Accountant cannot access owner layout/routes
    if (pathname.startsWith("/owner") && user.role !== "owner") {
      const targetUrl = new URL("/accountant", request.url);
      return NextResponse.redirect(targetUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon)
     * - login_preview.png (dashboard layout preview image)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|login_preview.png).*)",
  ],
};
