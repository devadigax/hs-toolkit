import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { REFRESH_TOKEN_COOKIE, COOKIE_NAME, EXPIRES_IN_COOKIE, PRIVATE_TOKEN_COOKIE } from "@/lib/constants";

export async function proxy(request: NextRequest) {
    const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE);
    const isAuthRoute = request.nextUrl.pathname.startsWith("/api/auth");
    const isPublicRoute = request.nextUrl.pathname === "/" || request.nextUrl.pathname.startsWith("/_next") || request.nextUrl.pathname.startsWith("/static");

    if (isAuthRoute || isPublicRoute) {
        return NextResponse.next();
    }

    // Allow if private token is present
    const privateToken = request.cookies.get(PRIVATE_TOKEN_COOKIE);
    if (privateToken) {
        return NextResponse.next();
    }

    if (!refreshToken) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    // Check for token expiration
    const expiresIn = request.cookies.get(EXPIRES_IN_COOKIE)?.value;
    const now = Date.now();
    const isExpired = expiresIn ? parseInt(expiresIn) <= now : true;

    if (refreshToken && isExpired) {
        console.log("Middleware: Token expired or missing expiration. Attempting refresh...");
        try {
            // We must use fetch here because @hubspot/api-client might not work in Edge runtime appropriately
            // or to keep it lightweight.
            const response = await fetch("https://api.hubapi.com/oauth/v1/token", {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: new URLSearchParams({
                    grant_type: "refresh_token",
                    client_id: process.env.HUBSPOT_CLIENT_ID || "",
                    client_secret: process.env.HUBSPOT_CLIENT_SECRET || "",
                    refresh_token: refreshToken.value,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                const newAccessToken = data.access_token;
                const newExpiresIn = data.expires_in;
                const newRefreshToken = data.refresh_token;

                const expiresAt = now + (newExpiresIn * 1000) - 60000;

                console.log("Middleware: Token refreshed successfully.");

                // 1. Update request cookies so Server Components see the new token immediately
                request.cookies.set(COOKIE_NAME, newAccessToken);
                request.cookies.set(EXPIRES_IN_COOKIE, expiresAt.toString());
                if (newRefreshToken) {
                    request.cookies.set(REFRESH_TOKEN_COOKIE, newRefreshToken);
                } else if (refreshToken) {
                    // Ensure the old refresh token is preserved in the cookies map we validate against
                    request.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken.value);
                }

                // 2. Sync cookies to request headers (Critical for SC to see updates)
                const requestHeaders = new Headers(request.headers);
                requestHeaders.set("cookie", request.cookies.toString());

                // 3. Pass the updated request headers
                const res = NextResponse.next({
                    request: {
                        headers: requestHeaders,
                    },
                });

                // 4. Update response cookies so the client (browser) persists the new token
                res.cookies.set(COOKIE_NAME, newAccessToken, { secure: process.env.NODE_ENV === "production", httpOnly: true, sameSite: "lax" });
                res.cookies.set(EXPIRES_IN_COOKIE, expiresAt.toString(), { secure: process.env.NODE_ENV === "production", httpOnly: true, sameSite: "lax" });
                if (newRefreshToken) {
                    res.cookies.set(REFRESH_TOKEN_COOKIE, newRefreshToken, { secure: process.env.NODE_ENV === "production", httpOnly: true, sameSite: "lax" });
                }

                return res;
            } else {
                console.error("Middleware: Failed to refresh token", await response.text());
                // If refresh fails, redirect to login? Or let it pass and fail in the app?
                // Redirecting to clear cookies and login is safer to avoid loops
                return NextResponse.redirect(new URL("/api/auth/login", request.url));
            }

        } catch (error) {
            console.error("Middleware: Error refreshing token", error);
            return NextResponse.redirect(new URL("/api/auth/login", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes, except auth which is handled above)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
    ],
};
