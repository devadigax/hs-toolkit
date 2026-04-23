import { NextResponse } from "next/server";
import { Client } from "@hubspot/api-client";
import crypto from "node:crypto";
import { cookies } from "next/headers";
import { OAUTH_STATE_COOKIE } from "@/lib/constants";

const hubspotClient = new Client();

export async function GET() {
    const scope = process.env.HUBSPOT_SCOPES || "crm.objects.contacts.read";
    const redirectUri = process.env.HUBSPOT_REDIRECT_URI || "http://localhost:3000/api/auth/callback";
    const state = crypto.randomBytes(24).toString("hex");

    const authorizationUrl = hubspotClient.oauth.getAuthorizationUrl(
        process.env.HUBSPOT_CLIENT_ID!,
        redirectUri,
        scope,
        state
    );

    const response = NextResponse.redirect(authorizationUrl);
    const cookieStore = await cookies();
    cookieStore.set(OAUTH_STATE_COOKIE, state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 600,
        path: "/",
    });

    return response;
}
