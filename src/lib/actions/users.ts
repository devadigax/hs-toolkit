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

        const json = (await response.json()) as any;

        if (json.results && Array.isArray(json.results)) {
            // Map the internal hs_createdate fields to the standard properties the table uses
            json.results = json.results.map((user: any) => ({
                ...user,
                createdAt: user.hs_createdate || user.createdAt,
                updatedAt: user.hs_lastmodifieddate || user.updatedAt,
            }));

            json.results.sort((a: any, b: any) => {
                const dateA = new Date(a.createdAt || 0).getTime();
                const dateB = new Date(b.createdAt || 0).getTime();
                return dateB - dateA;
            });
        }

        return serialize(json);
    } catch (e) {
        console.error("Error fetching users:", e);
        throw e;
    }
}
