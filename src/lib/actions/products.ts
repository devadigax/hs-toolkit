"use server";

import { getHubSpotClient } from "@/lib/hubspot-server";
import { searchObjects } from "./common";
import { OBJECT_PROPERTIES } from "./config";

export async function getProducts(limit: number = 100, after?: string, query?: string, showInactive: boolean = false) {
    const hubspotClient = await getHubSpotClient();

    const filterGroups: any[] = [];
    const statusFilter = !showInactive ? { propertyName: "hs_status", operator: "NEQ", value: "inactive" } : null;

    if (query) {
        const searchProperties = ["name", "hs_sku", "description"];
        searchProperties.forEach(prop => {
            const filters = [{ propertyName: prop, operator: "CONTAINS_TOKEN", value: query }];
            if (statusFilter) {
                filters.push(statusFilter);
            }
            filterGroups.push({ filters });
        });
    } else if (statusFilter) {
        filterGroups.push({ filters: [statusFilter] });
    }

    return searchObjects(
        hubspotClient.crm.products.searchApi,
        OBJECT_PROPERTIES.products,
        limit,
        after,
        filterGroups
    );
}
