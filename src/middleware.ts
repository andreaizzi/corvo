import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Routes that require authentication
const protectedRoutes = [
    "/dashboard",
    "/vault",
    "/recipients",
    "/settings",
    "/checkin",
];

// Routes that should redirect to dashboard if authenticated
const authRoutes = [
    "/auth/signin",
    "/auth/signup",
];

export async function middleware(request: NextRequest) {
    const token = await getToken({
        req: request,
        secret: process.env.AUTH_SECRET,
    });

    const { pathname } = request.nextUrl;

    // Check if the route is protected
    const isProtectedRoute = protectedRoutes.some((route) =>
        pathname.startsWith(route)
    );

    // Check if the route is an auth route
    const isAuthRoute = authRoutes.some((route) =>
        pathname.startsWith(route)
    );

    // Redirect to signin if accessing protected route without authentication
    if (isProtectedRoute && !token) {
        const url = new URL("/auth/signin", request.url);
        url.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(url);
    }

    // Redirect to dashboard if accessing auth routes while authenticated
    if (isAuthRoute && token) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Check if user is active (you might want to refresh this from database periodically)
    if (token && !token.isActive && isProtectedRoute) {
        return NextResponse.redirect(new URL("/auth/error?error=AccessDenied", request.url));
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
         * - favicon.ico (favicon file)
         * - public folder
         */
        "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
    ],
};