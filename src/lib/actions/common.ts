"use server";

import { getHubSpotClient, getAccessToken } from "@/lib/hubspot-server";
import { unstable_cache, updateTag } from "next/cache";
import { Client } from "@hubspot/api-client";
import { serialize } from "@/lib/utils";
import { OBJECT_PROPERTIES, ASSOCIATION_MAP, DEFAULT_SORT } from "./config";
import { hashString } from "@/lib/server-utils";

export async function searchObjects(
    api: any,
    properties: readonly string[], // readonly to match OBJECT_PROPERTIES types
    limit: number,
    after?: string,
    filterGroups: any[] = [],
    sorts: any[] = [DEFAULT_SORT]
) {
    const searchRequest = {
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

    let api: any;
    switch (type) {
        case "contacts": api = hubspotClient.crm.contacts.searchApi; break;
        case "companies": api = hubspotClient.crm.companies.searchApi; break;
        case "deals": api = hubspotClient.crm.deals.searchApi; break;
        case "tickets": api = hubspotClient.crm.tickets.searchApi; break;
        case "quotes": api = hubspotClient.crm.quotes.searchApi; break;
        case "products": api = hubspotClient.crm.products.searchApi; break;
        case "line-items": api = hubspotClient.crm.lineItems.searchApi; break;
        default: throw new Error("Invalid object type");
    }

    const filterGroups: any[] = [];
    if (query && queryProps && queryProps.length > 0) {
        queryProps.forEach(prop => {
            filterGroups.push({
                filters: [{ propertyName: prop, operator: "CONTAINS_TOKEN", value: query }]
            });
        });
    }

    return searchObjects(api, properties, limit, after, filterGroups);
}

const getCachedFirstPage = async (type: keyof typeof OBJECT_PROPERTIES, limit: number) => {
    const accessToken = await getAccessToken();

    return unstable_cache(async () => {
        const hubspotClient = new Client({ accessToken });
        const properties = OBJECT_PROPERTIES[type];

        let api: any;
        switch (type) {
            case "contacts": api = hubspotClient.crm.contacts.searchApi; break;
            case "companies": api = hubspotClient.crm.companies.searchApi; break;
            case "deals": api = hubspotClient.crm.deals.searchApi; break;
            case "tickets": api = hubspotClient.crm.tickets.searchApi; break;
            case "quotes": api = hubspotClient.crm.quotes.searchApi; break;
            case "products": api = hubspotClient.crm.products.searchApi; break;
            case "line-items": api = hubspotClient.crm.lineItems.searchApi; break;
            default: throw new Error("Invalid object type");
        }

        const sorts = [DEFAULT_SORT];
        const searchRequest = {
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

    let batchApi;
    let basicApi;
    switch (type) {
        case "contacts":
            batchApi = hubspotClient.crm.contacts.batchApi;
            basicApi = hubspotClient.crm.contacts.basicApi;
            break;
        case "companies":
            batchApi = hubspotClient.crm.companies.batchApi;
            basicApi = hubspotClient.crm.companies.basicApi;
            break;
        case "deals":
            batchApi = hubspotClient.crm.deals.batchApi;
            basicApi = hubspotClient.crm.deals.basicApi;
            break;
        case "tickets":
            batchApi = hubspotClient.crm.tickets.batchApi;
            basicApi = hubspotClient.crm.tickets.basicApi;
            break;
        case "products":
            batchApi = hubspotClient.crm.products.batchApi;
            basicApi = hubspotClient.crm.products.basicApi;
            break;
        case "quotes":
            batchApi = hubspotClient.crm.quotes.batchApi;
            basicApi = hubspotClient.crm.quotes.basicApi;
            break;
        case "line-items":
            batchApi = hubspotClient.crm.lineItems.batchApi;
            basicApi = hubspotClient.crm.lineItems.basicApi;
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

    const response = await batchApi.read(batchInput as any);
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
                (result as any).associations = associations;

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

async function enrichAssociations(hubspotClient: any, associations: any) {
    for (const assocType of Object.keys(associations)) {
        const items = (associations as any)[assocType].results;
        if (!items || items.length === 0) continue;

        const inputs = items.map((item: any) => ({ id: item.id }));
        let api: any;
        let properties: string[] = [];

        switch (assocType) {
            case "contacts":
                api = hubspotClient.crm.contacts.batchApi;
                properties = ["firstname", "lastname", "email"];
                break;
            case "companies":
                api = hubspotClient.crm.companies.batchApi;
                properties = ["name"];
                break;
            case "deals":
                api = hubspotClient.crm.deals.batchApi;
                properties = ["dealname"];
                break;
            case "tickets":
                api = hubspotClient.crm.tickets.batchApi;
                properties = ["subject"];
                break;
            case "products":
                api = hubspotClient.crm.products.batchApi;
                properties = ["name"];
                break;
            case "quotes":
                api = hubspotClient.crm.quotes.batchApi;
                properties = ["hs_title"];
                break;
            case "line items":
            case "line_items":
            case "line-items":
                api = hubspotClient.crm.lineItems.batchApi;
                properties = ["name", "hs_sku"];
                break;
        }

        if (api && properties.length > 0) {
            try {
                const batchResponse = await api.read({ inputs, properties });
                const detailsMap = new Map(batchResponse.results.map((r: any) => [r.id, r.properties]));

                items.forEach((item: any) => {
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

    let api;
    switch (type) {
        case "contacts": api = hubspotClient.crm.contacts.batchApi; break;
        case "companies": api = hubspotClient.crm.companies.batchApi; break;
        case "deals": api = hubspotClient.crm.deals.batchApi; break;
        case "tickets": api = hubspotClient.crm.tickets.batchApi; break;
        case "products": api = hubspotClient.crm.products.batchApi; break;
        case "quotes": api = hubspotClient.crm.quotes.batchApi; break;
        case "line-items": api = hubspotClient.crm.lineItems.batchApi; break;
        default: throw new Error("Invalid object type");
    }

    const batchInput = {
        inputs: [{ id }],
        propertiesWithHistory: [property],
    };

    const response = await api.read(batchInput as any);
    const result = response.results[0];

    // @ts-ignore
    const history = result?.propertiesWithHistory?.[property] || [];
    return serialize(history);
}
