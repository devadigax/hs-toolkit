"use server";

import { getHubSpotClient, getAccessToken } from "@/lib/hubspot-server";
import { unstable_cache, updateTag } from "next/cache";
import { Client } from "@hubspot/api-client";
import { serialize } from "@/lib/utils";
import { OBJECT_PROPERTIES, ASSOCIATION_MAP, DEFAULT_SORT } from "./config";
import { hashString } from "@/lib/server-utils";
import type { FilterGroup, Sort, HubSpotSearchRequest } from "@/types/hubspot";

export interface SearchCapableApi {
    doSearch(request: HubSpotSearchRequest): Promise<any>;
}

export async function searchObjects(
    api: SearchCapableApi,
    properties: readonly string[], // readonly to match OBJECT_PROPERTIES types
    limit: number,
    after?: string,
    filterGroups: FilterGroup[] = [],
    sorts: Sort[] = [DEFAULT_SORT]
) {
    const searchRequest: HubSpotSearchRequest = {
        filterGroups,
        sorts,
        properties: properties as string[], // cast back to mutable array for API client
        limit,
        after,
    };
    return serialize(await api.doSearch(searchRequest));
}

export async function getObjectsByType(type: keyof typeof OBJECT_PROPERTIES, limit: number, after?: string, query?: string, queryProps?: string[]) {
    // Use cache if it's the first page (no after cursor) and no search query
    if (!after && !query) {
        try {
            return await getCachedFirstPage(type, limit);
        } catch (e) {
            console.error(`Error fetching cached ${type} list:`, e);
        }
    }

    const hubspotClient = await getHubSpotClient();
    const properties = OBJECT_PROPERTIES[type];

    let api: SearchCapableApi;
    switch (type) {
        case "contacts": api = hubspotClient.crm.contacts.searchApi as unknown as SearchCapableApi; break;
        case "companies": api = hubspotClient.crm.companies.searchApi as unknown as SearchCapableApi; break;
        case "deals": api = hubspotClient.crm.deals.searchApi as unknown as SearchCapableApi; break;
        case "tickets": api = hubspotClient.crm.tickets.searchApi as unknown as SearchCapableApi; break;
        case "quotes": api = hubspotClient.crm.quotes.searchApi as unknown as SearchCapableApi; break;
        case "products": api = hubspotClient.crm.products.searchApi as unknown as SearchCapableApi; break;
        case "line-items": api = hubspotClient.crm.lineItems.searchApi as unknown as SearchCapableApi; break;
        default: throw new Error("Invalid object type");
    }

    const filterGroups: FilterGroup[] = [];
    if (query && queryProps && queryProps.length > 0) {
        queryProps.forEach(prop => {
            filterGroups.push({
                filters: [{ propertyName: prop, operator: "CONTAINS_TOKEN", value: query }]
            });
        });
    }

    return searchObjects(api, properties, limit, after, filterGroups);
}

export async function getDeletedObjectsByType(type: keyof typeof OBJECT_PROPERTIES, limit: number, after?: string) {
    const hubspotClient = await getHubSpotClient();
    const properties = ["hs_object_id", ...OBJECT_PROPERTIES[type]]; // Ensure ID is present

    let api: BasicCapableApi;
    switch (type) {
        case "contacts": api = hubspotClient.crm.contacts.basicApi as unknown as BasicCapableApi; break;
        case "companies": api = hubspotClient.crm.companies.basicApi as unknown as BasicCapableApi; break;
        case "deals": api = hubspotClient.crm.deals.basicApi as unknown as BasicCapableApi; break;
        case "tickets": api = hubspotClient.crm.tickets.basicApi as unknown as BasicCapableApi; break;
        case "quotes": api = hubspotClient.crm.quotes.basicApi as unknown as BasicCapableApi; break;
        case "products": api = hubspotClient.crm.products.basicApi as unknown as BasicCapableApi; break;
        case "line-items": api = hubspotClient.crm.lineItems.basicApi as unknown as BasicCapableApi; break;
        default: throw new Error("Invalid object type");
    }

    try {
        // basicApi.getPage(limit, after, properties, propertiesWithHistory, associations, archived)
        const response = await api.getPage(limit, after, properties, undefined, undefined, true);
        return serialize(response);
    } catch (error) {
        console.error(`Error fetching deleted ${type}:`, error);
        throw error;
    }
}

interface BatchCapableApi {
    read(request: any): Promise<{ results: import("@/types/hubspot").HubSpotObject[] }>;
}

interface BasicCapableApi {
    getById(id: string, properties?: string[], propertiesWithHistory?: string[], associations?: string[]): Promise<{ associations?: Record<string, import("@/types/hubspot").HubSpotAssociation> }>;
    getPage(limit?: number, after?: string, properties?: string[], propertiesWithHistory?: string[], associations?: string[], archived?: boolean): Promise<{ results: import("@/types/hubspot").HubSpotObject[], paging?: any }>;
}

const getCachedFirstPage = async (type: keyof typeof OBJECT_PROPERTIES, limit: number) => {
    const accessToken = await getAccessToken();

    return unstable_cache(async () => {
        const hubspotClient = new Client({ accessToken });
        const properties = OBJECT_PROPERTIES[type];

        let api: SearchCapableApi;
        switch (type) {
            case "contacts": api = hubspotClient.crm.contacts.searchApi as unknown as SearchCapableApi; break;
            case "companies": api = hubspotClient.crm.companies.searchApi as unknown as SearchCapableApi; break;
            case "deals": api = hubspotClient.crm.deals.searchApi as unknown as SearchCapableApi; break;
            case "tickets": api = hubspotClient.crm.tickets.searchApi as unknown as SearchCapableApi; break;
            case "quotes": api = hubspotClient.crm.quotes.searchApi as unknown as SearchCapableApi; break;
            case "products": api = hubspotClient.crm.products.searchApi as unknown as SearchCapableApi; break;
            case "line-items": api = hubspotClient.crm.lineItems.searchApi as unknown as SearchCapableApi; break;
            default: throw new Error("Invalid object type");
        }

        const sorts: Sort[] = [DEFAULT_SORT];
        const searchRequest: HubSpotSearchRequest = {
            filterGroups: [],
            sorts,
            properties: [...properties],
            limit,
            after: undefined,
        };
        return serialize(await api.doSearch(searchRequest));
    }, [`${type}-list-first-page-${limit}-${hashString(accessToken)}`], { tags: [`${type}-list`] })();
};

export async function refreshObjectList(type: string) {
    updateTag(`${type}-list`);
}

export async function getAllProperties(type: string) {
    const accessToken = await getAccessToken();

    return unstable_cache(async () => {
        const hubspotClient = new Client({ accessToken });
        const objectType = type === "line-items" ? "line_items" : (type === "engagements" ? "engagements" : type);

        try {
            const response = await hubspotClient.crm.properties.coreApi.getAll(objectType);
            return response.results.map((prop: any) => prop.name);
        } catch (e) {
            console.error("Error fetching properties for " + type, e);
            if (type === "engagements") {
                return OBJECT_PROPERTIES.engagements;
            }
            return [];
        }
    }, ['all-properties', type, hashString(accessToken)], { tags: ['properties'] })();
} // Note: We might want to scope this too if properties vary by user, but usually schema is account-wide. Safer to scope it anyway.


export async function getObject(type: string, id: string) {
    const hubspotClient = await getHubSpotClient();

    // Special handling for engagements
    if (type === "engagements") {
        return getEngagementObject(hubspotClient, id);
    }

    let batchApi: BatchCapableApi | undefined;
    let basicApi: BasicCapableApi | undefined;
    switch (type) {
        case "contacts":
            batchApi = hubspotClient.crm.contacts.batchApi as unknown as BatchCapableApi;
            basicApi = hubspotClient.crm.contacts.basicApi as unknown as BasicCapableApi;
            break;
        case "companies":
            batchApi = hubspotClient.crm.companies.batchApi as unknown as BatchCapableApi;
            basicApi = hubspotClient.crm.companies.basicApi as unknown as BasicCapableApi;
            break;
        case "deals":
            batchApi = hubspotClient.crm.deals.batchApi as unknown as BatchCapableApi;
            basicApi = hubspotClient.crm.deals.basicApi as unknown as BasicCapableApi;
            break;
        case "tickets":
            batchApi = hubspotClient.crm.tickets.batchApi as unknown as BatchCapableApi;
            basicApi = hubspotClient.crm.tickets.basicApi as unknown as BasicCapableApi;
            break;
        case "products":
            batchApi = hubspotClient.crm.products.batchApi as unknown as BatchCapableApi;
            basicApi = hubspotClient.crm.products.basicApi as unknown as BasicCapableApi;
            break;
        case "quotes":
            batchApi = hubspotClient.crm.quotes.batchApi as unknown as BatchCapableApi;
            basicApi = hubspotClient.crm.quotes.basicApi as unknown as BasicCapableApi;
            break;
        case "line-items":
            batchApi = hubspotClient.crm.lineItems.batchApi as unknown as BatchCapableApi;
            basicApi = hubspotClient.crm.lineItems.basicApi as unknown as BasicCapableApi;
            break;
        default: throw new Error("Invalid object type");
    }

    const properties = await getAllProperties(type);
    const lookupType = type === "line-items" ? "line-items" : type;
    const associationsToFetch = ASSOCIATION_MAP[lookupType] || [];

    const batchInput = {
        inputs: [{ id }],
        properties,
    };

    if (!batchApi) {
        throw new Error(`Batch API not available for type ${type}`);
    }

    const response = await batchApi.read(batchInput);
    const result = response.results[0];

    if (!result) {
        throw new Error("Object not found");
    }

    if (associationsToFetch.length > 0) {
        if (!basicApi) {
            // warn
        } else {
            try {
                const assocResponse = await basicApi.getById(id, undefined, undefined, associationsToFetch);
                const associations = assocResponse.associations;
                result.associations = associations;

                if (associations) {
                    await enrichAssociations(hubspotClient, associations);
                }
            } catch (error) {
                console.error(`Error fetching associations for ${type} ${id}:`, error);
            }
        }
    }

    return serialize(result);
}

// Helper functions for getObject
async function getEngagementObject(hubspotClient: any, id: string) {
    try {
        const properties = await getAllProperties("engagements");
        const response = await hubspotClient.apiRequest({
            method: 'GET',
            path: `/crm/v3/objects/engagements/${id}?properties=${properties.join(',')}&associations=contacts,companies,deals,tickets`,
        });
        const result = await response.json();

        if (!result || result.status === 'error') {
            throw new Error("Object not found");
        }
        return serialize(result);
    } catch (e) {
        console.error("Error fetching single engagement:", e);
        throw e;
    }
}

async function enrichAssociations(hubspotClient: any, associations: Record<string, import("@/types/hubspot").HubSpotAssociation>) {
    for (const assocType of Object.keys(associations)) {
        const items = associations[assocType].results as (import("@/types/hubspot").HubSpotAssociationResult & Record<string, any>)[];
        if (!items || items.length === 0) continue;

        const inputs = items.map((item) => ({ id: item.id }));
        let api: BatchCapableApi | undefined;
        let properties: string[] = [];

        switch (assocType) {
            case "contacts":
                api = hubspotClient.crm.contacts.batchApi as unknown as BatchCapableApi;
                properties = ["firstname", "lastname", "email"];
                break;
            case "companies":
                api = hubspotClient.crm.companies.batchApi as unknown as BatchCapableApi;
                properties = ["name"];
                break;
            case "deals":
                api = hubspotClient.crm.deals.batchApi as unknown as BatchCapableApi;
                properties = ["dealname"];
                break;
            case "tickets":
                api = hubspotClient.crm.tickets.batchApi as unknown as BatchCapableApi;
                properties = ["subject"];
                break;
            case "products":
                api = hubspotClient.crm.products.batchApi as unknown as BatchCapableApi;
                properties = ["name"];
                break;
            case "quotes":
                api = hubspotClient.crm.quotes.batchApi as unknown as BatchCapableApi;
                properties = ["hs_title"];
                break;
            case "line items":
            case "line_items":
            case "line-items":
                api = hubspotClient.crm.lineItems.batchApi as unknown as BatchCapableApi;
                properties = ["name", "hs_sku"];
                break;
            case "engagements":
                // Engagements are special, they don't have a standard batchApi exposed on the client in the same way,
                // or we want to use the unified v3 endpoint.
                try {
                    const engagementProperties = ["hs_engagement_type", "hs_task_subject", "hs_meeting_title", "hs_note_body", "hs_body_preview", "hs_timestamp"];
                    const batchResponse = await hubspotClient.apiRequest({
                        method: 'POST',
                        path: '/crm/v3/objects/engagements/batch/read',
                        body: {
                            inputs,
                            properties: engagementProperties
                        }
                    });
                    const data = await batchResponse.json();

                    if (data.results) {
                        const detailsMap = new Map(data.results.map((r: import("@/types/hubspot").HubSpotObject) => [r.id, r.properties]));
                        items.forEach((item) => {
                            const details = detailsMap.get(item.id);
                            if (details) {
                                Object.assign(item, details);
                            }
                        });
                    }
                } catch (err) {
                    console.error(`Error batch fetching details for engagements:`, err);
                }
                continue; // Skip the default api.read logic
        }

        if (api && properties.length > 0) {
            try {
                const batchResponse = await api.read({ inputs, properties });
                const detailsMap = new Map(batchResponse.results.map((r) => [r.id, r.properties]));

                items.forEach((item) => {
                    const details = detailsMap.get(item.id);
                    if (details) {
                        Object.assign(item, details);
                    }
                });
            } catch (err) {
                console.error(`Error batch fetching details for ${assocType}:`, err);
            }
        }
    }
}

export async function getPropertyHistory(type: string, id: string, property: string) {
    const hubspotClient = await getHubSpotClient();

    if (type === "engagements") {
        return [];
    }

    let api: BatchCapableApi;
    switch (type) {
        case "contacts": api = hubspotClient.crm.contacts.batchApi as unknown as BatchCapableApi; break;
        case "companies": api = hubspotClient.crm.companies.batchApi as unknown as BatchCapableApi; break;
        case "deals": api = hubspotClient.crm.deals.batchApi as unknown as BatchCapableApi; break;
        case "tickets": api = hubspotClient.crm.tickets.batchApi as unknown as BatchCapableApi; break;
        case "products": api = hubspotClient.crm.products.batchApi as unknown as BatchCapableApi; break;
        case "quotes": api = hubspotClient.crm.quotes.batchApi as unknown as BatchCapableApi; break;
        case "line-items": api = hubspotClient.crm.lineItems.batchApi as unknown as BatchCapableApi; break;
        default: throw new Error("Invalid object type");
    }

    const batchInput = {
        inputs: [{ id }],
        propertiesWithHistory: [property],
    };

    const response = await api.read(batchInput);
    const result = response.results[0];

    // Access propertiesWithHistory safely by casting
    const history = (result as any)?.propertiesWithHistory?.[property] || [];
    return serialize(history);
}
