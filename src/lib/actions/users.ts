"use server";

import { getHubSpotClient } from "@/lib/hubspot-server";
import { serialize } from "@/lib/utils";

export async function getUsers(limit: number = 100, after?: string) {
    const hubspotClient = await getHubSpotClient();

    let path = '/settings/v3/users/?limit=' + limit;
    if (after) {
        path += '&after=' + after;
    }

    try {
        const response = await hubspotClient.apiRequest({
            method: 'GET',
            path: path,
        });

        const json = await response.json();
        return serialize(json);
    } catch (e) {
        console.error("Error fetching users:", e);
        throw e;
    }
}
