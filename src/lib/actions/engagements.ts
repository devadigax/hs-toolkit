"use server";

import { getHubSpotClient } from "@/lib/hubspot-server";
import { serialize } from "@/lib/utils";
import { OBJECT_PROPERTIES } from "./config";

export async function getEngagements(limit: number = 20, after?: string, query?: string) {
    const hubspotClient = await getHubSpotClient();

    const filterGroups = [];
    if (query) {
        filterGroups.push({
            filters: [
                { propertyName: "hs_body_preview", operator: "CONTAINS_TOKEN", value: query }
            ]
        });
    }

    const sort = { propertyName: "hs_timestamp", direction: "DESCENDING" };

    const searchRequest = {
        filterGroups,
        sorts: [sort],
        properties: OBJECT_PROPERTIES.engagements,
        limit,
        after,
    };

    try {
        const response = await hubspotClient.apiRequest({
            method: 'POST',
            path: '/crm/v3/objects/engagements/search',
            body: searchRequest,
        });

        const json = await response.json();
        return serialize(json);
    } catch (e) {
        console.error("Error fetching engagements:", e);
        throw e;
    }
}
