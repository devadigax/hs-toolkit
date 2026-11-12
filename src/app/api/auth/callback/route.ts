import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, REFRESH_TOKEN_COOKIE, EXPIRES_IN_COOKIE, OAUTH_STATE_COOKIE, PRIVATE_TOKEN_COOKIE } from "@/lib/constants";
import { cookies } from "next/headers";
import { getErrorMessage } from "@/lib/utils";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!code) {
        return NextResponse.json({ error: "Code not found" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const expectedState = cookieStore.get(OAUTH_STATE_COOKIE)?.value;
    if (!state || !expectedState || state !== expectedState) {
        return NextResponse.json({ error: "Invalid OAuth state" }, { status: 400 });
    }

    try {
        const tokenExchangeResponse = await fetch("https://api.hubapi.com/oauth/2026-09/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                grant_type: "authorization_code",
                code,
                redirect_uri: process.env.HUBSPOT_REDIRECT_URI || "",
                client_id: process.env.HUBSPOT_CLIENT_ID || "",
                client_secret: process.env.HUBSPOT_CLIENT_SECRET || "",
            }),
        });

        if (!tokenExchangeResponse.ok) {
            throw new Error(`HubSpot token exchange failed: ${tokenExchangeResponse.status}`);
        }

        const { access_token: accessToken, refresh_token: refreshToken, expires_in: expiresIn } =
            await tokenExchangeResponse.json() as { access_token: string; refresh_token: string; expires_in: number };
        const response = NextResponse.redirect(new URL("/dashboard", request.url));

        // Set Access Token
        response.cookies.set(COOKIE_NAME, accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: expiresIn,
            path: "/",
        });

        // Set Refresh Token (Make it last longer, e.g., 30 days)
        response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: "/",
        });

        // Set Expiration Time
        response.cookies.set(EXPIRES_IN_COOKIE, (Date.now() + expiresIn * 1000).toString(), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: expiresIn,
            path: "/",
        });
        response.cookies.delete(OAUTH_STATE_COOKIE);
        response.cookies.delete(PRIVATE_TOKEN_COOKIE);

        return response;
    } catch (error: unknown) {
        console.error("Error exchanging code for token:", error);
        return NextResponse.json(
            { error: "Failed to exchange code for token", details: getErrorMessage(error) },
            { status: 500 }
        );
    }
}
