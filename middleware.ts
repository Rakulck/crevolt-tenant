import { type NextRequest, NextResponse } from "next/server"

import { updateSession } from "./packages/supabase/src/clients/middleware"

export async function middleware(request: NextRequest) {
  // Update session and get auth state
  const { response, user } = await updateSession(request, NextResponse.next())

  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ["/auth", "/auth/forgot-password"]
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  // Root path should redirect to auth if not authenticated, dashboard if authenticated
  if (pathname === "/") {
    if (user) {
      return Response.redirect(new URL("/dashboard", request.url))
    } else {
      return Response.redirect(new URL("/auth", request.url))
    }
  }

  // If user is not authenticated and trying to access protected route
  if (!user && !isPublicRoute) {
    return Response.redirect(new URL("/auth", request.url))
  }

  // If user is authenticated and trying to access auth pages
  if (user && isPublicRoute) {
    return Response.redirect(new URL("/dashboard", request.url))
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
