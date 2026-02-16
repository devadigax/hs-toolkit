import { NextResponse } from "next/server";
import { Client } from "@hubspot/api-client";

const hubspotClient = new Client();

export async function GET() {
    const scope = process.env.HUBSPOT_SCOPES || "crm.objects.contacts.read";
    const redirectUri = process.env.HUBSPOT_REDIRECT_URI || "http://localhost:3000/api/auth/callback";

    const authorizationUrl = hubspotClient.oauth.getAuthorizationUrl(
        process.env.HUBSPOT_CLIENT_ID!,
        redirectUri,
        scope
    );

    return NextResponse.redirect(authorizationUrl);
}
