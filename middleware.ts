import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Logged-in non-admin visiting an admin route → redirect home
    if (pathname.startsWith("/admin") && token?.role !== "admin") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Return true to allow the request; false redirects to the signIn page
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Admin routes: must be authenticated (role check done in middleware fn above)
        if (pathname.startsWith("/admin")) return !!token;

        // User-protected routes: must be authenticated
        const protectedPrefixes = ["/cart", "/checkout", "/orders"];
        if (protectedPrefixes.some((p) => pathname.startsWith(p))) return !!token;

        return true;
      },
    },
  }
);

export const config = {
  // Run middleware only on routes that need protection
  matcher: [
    "/cart/:path*",
    "/checkout/:path*",
    "/orders/:path*",
    "/admin/:path*",
  ],
};
