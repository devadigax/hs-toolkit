"use server";

import { getHubSpotClient } from "@/lib/hubspot-server";
import { serialize } from "@/lib/utils";
import { OBJECT_PROPERTIES } from "./config";
import type { Filter, FilterGroup, Sort } from "@/types/hubspot";

export async function getEngagements(limit: number = 20, after?: string, query?: string, searchField?: string, activityType?: string) {
    const hubspotClient = await getHubSpotClient();

    const filterGroups: FilterGroup[] = [];

    // Base filters from search query
    const baseFilters: Filter[] = [];
    if (query) {
        if (searchField && searchField !== "all") {
            baseFilters.push({ propertyName: searchField, operator: "CONTAINS_TOKEN", value: query });
        } else {
            baseFilters.push({ propertyName: "hs_body_preview", operator: "CONTAINS_TOKEN", value: query });
        }
    }

    // Add activityType filter
    if (activityType && activityType !== "all") {
        const typeFilter = { propertyName: "hs_engagement_type", operator: "EQ", value: activityType };
        if (baseFilters.length > 0) {
            // Combine with existing query filter in the same filter group (AND)
            filterGroups.push({ filters: [...baseFilters, typeFilter] });
        } else {
            // Just the type filter
            filterGroups.push({ filters: [typeFilter] });
        }
    } else if (baseFilters.length > 0) {
        // Just the query filter
        filterGroups.push({ filters: baseFilters });
    }

    const sort: Sort = { propertyName: "hs_timestamp", direction: "DESCENDING" };

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
