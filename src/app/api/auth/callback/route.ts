import { NextRequest, NextResponse } from "next/server";
import { Client } from "@hubspot/api-client";
import { COOKIE_NAME, REFRESH_TOKEN_COOKIE, EXPIRES_IN_COOKIE, OAUTH_STATE_COOKIE, PRIVATE_TOKEN_COOKIE } from "@/lib/constants";
import { cookies } from "next/headers";
import { getErrorMessage } from "@/lib/utils";

const hubspotClient = new Client();

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
        const tokenResponse = await hubspotClient.oauth.tokensApi.create(
            "authorization_code",
            code,
            process.env.HUBSPOT_REDIRECT_URI,
            process.env.HUBSPOT_CLIENT_ID,
            process.env.HUBSPOT_CLIENT_SECRET
        );

        const { accessToken, refreshToken, expiresIn } = tokenResponse;

        // Set Access Token
        cookieStore.set(COOKIE_NAME, accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: expiresIn,
            path: "/",
        });

        // Set Refresh Token (Make it last longer, e.g., 30 days)
        cookieStore.set(REFRESH_TOKEN_COOKIE, refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: "/",
        });

        // Set Expiration Time
        cookieStore.set(EXPIRES_IN_COOKIE, (Date.now() + expiresIn * 1000).toString(), {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: expiresIn,
            path: "/",
        });
        cookieStore.delete(OAUTH_STATE_COOKIE);
        cookieStore.delete(PRIVATE_TOKEN_COOKIE);

        return NextResponse.redirect(new URL("/dashboard", request.url));
    } catch (error: unknown) {
        console.error("Error exchanging code for token:", error);
        return NextResponse.json(
            { error: "Failed to exchange code for token", details: getErrorMessage(error) },
            { status: 500 }
        );
    }
}
