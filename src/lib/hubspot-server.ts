import "server-only";

// Suppress the "url.parse() behavior is not standardized" deprecation warning
// This comes from the @hubspot/api-client dependency (likely via node-fetch v2)
const originalEmitWarning = process.emitWarning;
process.emitWarning = function (warning: string | Error, ...args: any[]) {
    if (
        (typeof warning === "string" && warning.includes("url.parse()")) ||
        (typeof warning === "object" && warning.message && warning.message.includes("url.parse()"))
    ) {
        return;
    }
    return originalEmitWarning.apply(process, [warning, ...args] as any);
};

import { Client } from "@hubspot/api-client";
import { cookies } from "next/headers";
import { COOKIE_NAME, REFRESH_TOKEN_COOKIE, EXPIRES_IN_COOKIE } from "@/lib/constants";

export const getHubSpotClient = async () => {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get(COOKIE_NAME)?.value;
    const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;

    if (!refreshToken) {
        throw new Error("No value for refresh token found in cookies");
    }

    const client = new Client();

    // Check if access token is present and valid (naive check existence)
    // A better approach would be to check expiration if stored
    const expiresIn = cookieStore.get(EXPIRES_IN_COOKIE)?.value;
    const now = Date.now();

    if (accessToken && expiresIn && parseInt(expiresIn) > now) {
        client.setAccessToken(accessToken);
        return client;
    }

    // Refresh token
    try {
        console.log("Access token expired or missing. Refreshing...");
        const tokenResponse = await client.oauth.tokensApi.create(
            "refresh_token",
            undefined, // code is undefined for refresh_token grant
            undefined, // redirectUri is optional or undefined for refresh_token grant
            process.env.HUBSPOT_CLIENT_ID,
            process.env.HUBSPOT_CLIENT_SECRET,
            refreshToken
        );

        const { accessToken: newAccessToken } = tokenResponse;

        client.setAccessToken(newAccessToken);

        // Note: We don't save cookies here because this might run in a Server Component.
        // Middleware (src/proxy.ts) handles the persistence of refreshed tokens.

        return client;

    } catch (error) {
        console.error("Error refreshing token:", error);
        throw new Error("Failed to refresh token");
    }
};

export const getHubSpotClientWithToken = (token: string) => {
    return new Client({ accessToken: token });
};
