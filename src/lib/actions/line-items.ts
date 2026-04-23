"use server";

import { getHubSpotClient } from "@/lib/hubspot-server";
import { searchObjects, SearchCapableApi } from "./common";
import { serialize } from "@/lib/utils";
import { OBJECT_PROPERTIES } from "./config";
import type { AssociationBatchReadResponse, FilterGroup, HubSpotAssociationResult, HubSpotObject } from "@/types/hubspot";

export async function getLineItems(limit: number = 100, after?: string, query?: string, searchField?: string) {
    const hubspotClient = await getHubSpotClient();
    let response;

    if (query) {
        const filterGroups: FilterGroup[] = [];
        if (searchField && searchField !== "all") {
            filterGroups.push({ filters: [{ propertyName: searchField, operator: "CONTAINS_TOKEN", value: query }] });
        } else {
            filterGroups.push(
                { filters: [{ propertyName: "name", operator: "CONTAINS_TOKEN", value: query }] },
                { filters: [{ propertyName: "hs_sku", operator: "CONTAINS_TOKEN", value: query }] },
                { filters: [{ propertyName: "description", operator: "CONTAINS_TOKEN", value: query }] }
            );
        }

        response = await searchObjects(
            hubspotClient.crm.lineItems.searchApi as unknown as SearchCapableApi,
            OBJECT_PROPERTIES["line-items"],
            limit,
            after,
            filterGroups
        );
    } else {
        response = await searchObjects(
            hubspotClient.crm.lineItems.searchApi as unknown as SearchCapableApi,
            OBJECT_PROPERTIES["line-items"],
            limit,
            after,
            []
        );
    }

    const lineItems = response.results;

    if (lineItems.length > 0) {
        const inputs = lineItems.map((item: HubSpotObject) => ({ id: item.id }));

        try {
            const [dealsResponse, quotesResponse] = await Promise.all([
                hubspotClient.crm.associations.batchApi.read("line_items", "deals", { inputs }),
                hubspotClient.crm.associations.batchApi.read("line_items", "quotes", { inputs })
            ]);

            const getMap = (response: unknown): Map<string, HubSpotAssociationResult[]> => new Map(
                (response as AssociationBatchReadResponse).results
                    .map((r) => {
                        const from = r.from || r._from;
                        if (!from || !from.id) return null;
                        return [from.id, (r.to || []) as HubSpotAssociationResult[]] as [string, HubSpotAssociationResult[]];
                    })
                    .filter((entry): entry is [string, HubSpotAssociationResult[]] => entry !== null)
            );

            const dealsMap = getMap(dealsResponse);
            const quotesMap = getMap(quotesResponse);

            lineItems.forEach((item: HubSpotObject) => {
                item.associations = {
                    deals: { results: dealsMap.get(item.id) || [] },
                    quotes: { results: quotesMap.get(item.id) || [] }
                };
            });

        } catch (e: unknown) {
            console.error("Error fetching batch associations:", e);
        }

        response.results = serialize(lineItems);
    }

    return response;
}
