import "server-only";

type EmitWarning = typeof process.emitWarning;

// Suppress the "url.parse() behavior is not standardized" deprecation warning
// This comes from the @hubspot/api-client dependency (likely via node-fetch v2)
const originalEmitWarning = process.emitWarning;
process.emitWarning = function (warning: string | Error, ...args: unknown[]) {
    if (
        (typeof warning === "string" && warning.includes("url.parse()")) ||
        (typeof warning === "object" && warning.message && warning.message.includes("url.parse()"))
    ) {
        return;
    }
    return (originalEmitWarning as EmitWarning)(warning, ...(args as Parameters<EmitWarning>[1][]));
} as EmitWarning;

import { Client } from "@hubspot/api-client";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { COOKIE_NAME, REFRESH_TOKEN_COOKIE, EXPIRES_IN_COOKIE, PRIVATE_TOKEN_COOKIE } from "@/lib/constants";

export const getAccessToken = async () => {
    const cookieStore = await cookies();

    // Check for private token first
    const privateToken = cookieStore.get(PRIVATE_TOKEN_COOKIE)?.value;
    if (privateToken) {
        return privateToken;
    }

    const accessToken = cookieStore.get(COOKIE_NAME)?.value;
    const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

    if (!refreshToken) {
        redirect("/api/auth/login");
    }

    const expiresIn = cookieStore.get(EXPIRES_IN_COOKIE)?.value;
    const now = Date.now();

    if (accessToken && expiresIn && parseInt(expiresIn) > now) {
        return accessToken;
    }

    // Refresh token
    try {
        console.log("Access token expired or missing. Refreshing...");
        const response = await fetch("https://api.hubapi.com/oauth/2026-09/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                grant_type: "refresh_token",
                client_id: process.env.HUBSPOT_CLIENT_ID || "",
                client_secret: process.env.HUBSPOT_CLIENT_SECRET || "",
                refresh_token: refreshToken,
            }),
        });

        if (!response.ok) {
            throw new Error(`HubSpot token refresh failed: ${response.status}`);
        }

        const { access_token: newAccessToken } = await response.json() as { access_token: string };

        // Note: We don't save cookies here because this might run in a Server Component.
        // Middleware (src/proxy.ts) handles the persistence of refreshed tokens.

        return newAccessToken;

    } catch (error) {
        console.error("Error refreshing token:", error);
        throw new Error("Failed to refresh token");
    }
};

export const getHubSpotClient = async () => {
    const accessToken = await getAccessToken();
    return new Client({ accessToken });
};

export const getHubSpotClientWithToken = (token: string) => {
    return new Client({ accessToken: token });
};
