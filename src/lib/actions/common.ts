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

function getApiForType(client: Client, type: string) {
    const typeMap: Record<string, any> = {
        contacts: client.crm.contacts,
        companies: client.crm.companies,
        deals: client.crm.deals,
        tickets: client.crm.tickets,
        products: client.crm.products,
        quotes: client.crm.quotes,
        "line-items": client.crm.lineItems,
        "line items": client.crm.lineItems,
        "line_items": client.crm.lineItems,
    };
    if (!typeMap[type]) throw new Error(`Invalid object type: ${type}`);
    return typeMap[type];
}

export async function getObjectsByType(type: keyof typeof OBJECT_PROPERTIES, limit: number, after?: string, query?: string, queryProps?: string[], searchField?: string) {
    // Use cache if it's the first page (no after cursor) and no search query
    if (!after && !query) {
        try {
            return await getCachedFirstPage(type, limit);
        } catch (e) {
            console.error(`Error fetching cached ${type} list:`, e);
        }
    }

    const hubspotClient = await getHubSpotClient();
    let properties: string[] = [...OBJECT_PROPERTIES[type]];

    // Ensure the searched field is returned in the properties list
    if (searchField && searchField !== "all" && !properties.includes(searchField as any)) {
        properties.push(searchField);
    }

    const api = getApiForType(hubspotClient, type).searchApi as unknown as SearchCapableApi;

    const filterGroups: FilterGroup[] = [];
    if (query) {
        if (searchField && searchField !== "all") {
            // Search strictly in the specified field
            filterGroups.push({
                filters: [{ propertyName: searchField, operator: "CONTAINS_TOKEN", value: query }]
            });
        } else if (queryProps && queryProps.length > 0) {
            // Default cross-field search
            queryProps.forEach(prop => {
                filterGroups.push({
                    filters: [{ propertyName: prop, operator: "CONTAINS_TOKEN", value: query }]
                });
            });
        }
    }

    return searchObjects(api, properties, limit, after, filterGroups);
}

export async function getDeletedObjectsByType(type: keyof typeof OBJECT_PROPERTIES, limit: number, after?: string) {
    const hubspotClient = await getHubSpotClient();
    const properties = ["hs_object_id", ...OBJECT_PROPERTIES[type]]; // Ensure ID is present

    const api = getApiForType(hubspotClient, type).basicApi as unknown as BasicCapableApi;

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

        const api = getApiForType(hubspotClient, type).searchApi as unknown as SearchCapableApi;

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

export async function getAllProperties(type: string): Promise<string[]> {
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
                return [...OBJECT_PROPERTIES.engagements] as unknown as string[];
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

    const apiClients = getApiForType(hubspotClient, type);
    const batchApi = apiClients.batchApi as unknown as BatchCapableApi;
    const basicApi = apiClients.basicApi as unknown as BasicCapableApi;

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
        const associations: Record<string, any> = {};
        for (const assocType of associationsToFetch) {
            try {
                const fromTypeStr = lookupType === "line-items" ? "line_items" : lookupType;
                const toTypeStr = assocType === "line items" || assocType === "line-items" ? "line_items" : assocType;

                const v4Response = await hubspotClient.apiRequest({
                    method: 'POST',
                    path: `/crm/v4/associations/${fromTypeStr}/${toTypeStr}/batch/read`,
                    body: {
                        inputs: [{ id }]
                    }
                });

                const v4Data = (await v4Response.json()) as any;

                if (v4Data?.status === "error") {
                    console.error(`V4 API returned error for ${fromTypeStr} to ${toTypeStr}:`, v4Data.message);
                    continue;
                }

                if (v4Data?.results?.[0]?.to) {
                    associations[assocType] = {
                        results: v4Data.results[0].to.map((item: any) => ({
                            id: item.toObjectId,
                            associationTypes: item.associationTypes
                        }))
                    };
                }
            } catch (err) {
                console.error(`Error fetching v4 association for ${lookupType} to ${assocType}:`, err);
            }
        }

        result.associations = associations;
        if (Object.keys(associations).length > 0) {
            await enrichAssociations(hubspotClient, associations);
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

        let targetProps: string[] = [];

        const defaultTargetPropsMap: Record<string, string[]> = {
            contacts: ["firstname", "lastname", "email", "createdate", "hs_createdate", "hs_created_by_user_id"],
            companies: ["name", "createdate", "hs_createdate", "hs_created_by_user_id"],
            deals: ["dealname", "createdate", "hs_createdate", "hs_created_by_user_id"],
            tickets: ["subject", "createdate", "hs_createdate", "hs_created_by_user_id"],
            products: ["name", "createdate", "hs_createdate", "hs_created_by_user_id"],
            quotes: ["hs_title", "createdate", "hs_createdate", "hs_created_by_user_id"],
        };

        if (defaultTargetPropsMap[assocType]) {
            api = getApiForType(hubspotClient, assocType).batchApi as unknown as BatchCapableApi;
            targetProps = defaultTargetPropsMap[assocType];
        } else {
            switch (assocType) {
                case "line items":
                case "line_items":
                case "line-items":
                    try {
                        const lineItemProps = ["name", "hs_name", "hs_sku", "createdate", "hs_createdate", "hs_created_by_user_id", "amount", "price", "quantity", "discount", "description"];
                        const batchResponse = await hubspotClient.apiRequest({
                            method: 'POST',
                            path: '/crm/v3/objects/line_items/batch/read',
                            body: {
                                inputs,
                                properties: lineItemProps
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
                        console.error(`Error batch fetching details for line items:`, err);
                    }
                    continue; // Skip the default api.read logic
                case "engagements":
                    // Engagements are special, they don't have a standard batchApi exposed on the client in the same way,
                    // or we want to use the unified v3 endpoint.
                    try {
                        const engagementProperties = ["hs_engagement_type", "hs_task_subject", "hs_meeting_title", "hs_note_body", "hs_body_preview", "hs_timestamp", "hs_created_by_user_id", "hs_created_by"];
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
        }

        if (api && targetProps.length > 0) {
            try {
                const objectTypeMap: Record<string, string> = {
                    contacts: "contacts",
                    companies: "companies",
                    deals: "deals",
                    tickets: "tickets",
                    quotes: "quotes",
                    "line items": "line_items",
                    "line_items": "line_items",
                    "line-items": "line_items",
                    engagements: "engagements"
                };

                const mappedType = objectTypeMap[assocType] || assocType;
                const dynamicProps = await getAllProperties(mappedType);
                properties = targetProps.filter((p: string) => dynamicProps.includes(p));

                if (properties.length === 0) {
                    console.warn(`No valid properties found for ${assocType} batch read`);
                    continue;
                }

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

    const api = getApiForType(hubspotClient, type).batchApi as unknown as BatchCapableApi;

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

export async function updateObjectProperty(type: string, id: string, property: string, value: string) {
    const hubspotClient = await getHubSpotClient();

    const api = getApiForType(hubspotClient, type).basicApi as unknown as BasicCapableApi;

    try {
        // @ts-ignore - updates conform to SimplePublicObjectInput but types might be slightly different per object
        await api.update(id, { properties: { [property]: value } });
        updateTag(`${type}-list`);
        updateTag(`${type}-${id}`);
        return { success: true };
    } catch (error: any) {
        console.error(`Error updating ${type} ${id} property ${property}:`, error);
        return { success: false, error: error.message };
    }
}

export async function createObject(type: string, properties: Record<string, string>) {
    const hubspotClient = await getHubSpotClient();

    const api = getApiForType(hubspotClient, type).basicApi as unknown as BasicCapableApi;

    try {
        // @ts-ignore - updates conform to SimplePublicObjectInput but types might be slightly different per object
        const response = await api.create({ properties });
        updateTag(`${type}-list`);
        return { success: true, data: serialize(response) };
    } catch (error: any) {
        console.error(`Error creating ${type}:`, error);
        return { success: false, error: error.message };
    }
}

interface BasicCapableApi {
    getById(id: string, properties?: string[], propertiesWithHistory?: string[], associations?: string[]): Promise<{ associations?: Record<string, import("@/types/hubspot").HubSpotAssociation> }>;
    getPage(limit?: number, after?: string, properties?: string[], propertiesWithHistory?: string[], associations?: string[], archived?: boolean): Promise<{ results: import("@/types/hubspot").HubSpotObject[], paging?: any }>;
    update(id: string, properties: any): Promise<any>;
    create(properties: any): Promise<any>;
}
