import { Client } from "@hubspot/api-client";

export const getHubSpotClient = (accessToken?: string) => {
  return new Client({ accessToken });
};

export const getAuthorizationUrl = (redirectUri: string, scopes: string) => {
  const client = new Client();
  return client.oauth.getAuthorizationUrl(
    process.env.HUBSPOT_CLIENT_ID!,
    redirectUri,
    scopes
  );
};
