"use server";

import { getHubSpotClient } from "@/lib/hubspot-server";
import { searchObjects, SearchCapableApi } from "./common";
import { OBJECT_PROPERTIES } from "./config";
import type { Filter, FilterGroup } from "@/types/hubspot";

export async function getProducts(limit: number = 100, after?: string, query?: string, showInactive: boolean = false, searchField?: string) {
    const hubspotClient = await getHubSpotClient();

    const filterGroups: FilterGroup[] = [];
    const statusFilter: Filter | null = !showInactive ? { propertyName: "hs_status", operator: "NEQ", value: "inactive" } : null;

    if (query) {
        if (searchField && searchField !== "all") {
            const filters: Filter[] = [{ propertyName: searchField, operator: "CONTAINS_TOKEN", value: query }];
            if (statusFilter) filters.push(statusFilter);
            filterGroups.push({ filters });
        } else {
            const searchProperties = ["name", "hs_sku", "description"];
            searchProperties.forEach(prop => {
                const filters: Filter[] = [{ propertyName: prop, operator: "CONTAINS_TOKEN", value: query }];
                if (statusFilter) {
                    filters.push(statusFilter);
                }
                filterGroups.push({ filters });
            });
        }
    } else if (statusFilter) {
        filterGroups.push({ filters: [statusFilter] });
    }

    return searchObjects(
        hubspotClient.crm.products.searchApi as unknown as SearchCapableApi,
        OBJECT_PROPERTIES.products,
        limit,
        after,
        filterGroups
    );
}
