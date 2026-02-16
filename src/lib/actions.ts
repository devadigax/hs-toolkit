"use server";

import { getHubSpotClient } from "@/lib/hubspot-server";
import { cookies } from "next/headers";
import { REFRESH_TOKEN_COOKIE, COOKIE_NAME, EXPIRES_IN_COOKIE } from "@/lib/constants";


const serialize = (data: any) => JSON.parse(JSON.stringify(data));

const OBJECT_PROPERTIES = {
    contacts: ["firstname", "lastname", "email", "phone", "website", "company", "country", "createdate"],
    companies: ["name", "domain", "city", "state", "createdate"],
    deals: ["dealname", "amount", "dealstage", "pipeline", "createdate"],
    tickets: ["subject", "content", "hs_pipeline_stage", "createdate"],
    quotes: ["hs_title", "hs_expiration_date", "createdate"],
    products: ["name", "description", "price", "hs_sku", "hs_status", "createdate"],
    "line-items": ["name", "description", "price", "quantity", "amount", "hs_sku", "createdate"],
    engagements: ["hs_engagement_type", "hs_timestamp", "hs_body_preview", "hubspot_owner_id", "hs_task_subject", "hs_meeting_title", "hs_note_body", "createdate"]
};
const ASSOCIATION_MAP: Record<string, string[]> = {
    contacts: ["companies", "deals", "tickets"],
    companies: ["contacts", "deals", "tickets"],
    deals: ["contacts", "companies", "line_items", "tickets"],
    tickets: ["contacts", "companies", "deals"],
    quotes: ["deals", "line_items"],
    "line-items": ["deals", "quotes"],
    engagements: ["contacts", "companies", "deals", "tickets"],
};

const DEFAULT_SORT = { propertyName: "createdate", direction: "DESCENDING" };

async function searchObjects(
    api: any,
    properties: string[],
    limit: number,
    after?: string,
    filterGroups: any[] = [],
    sorts: any[] = [DEFAULT_SORT]
) {
    const searchRequest = {
        filterGroups,
        sorts,
        properties,
        limit,
        after,
    };
    return serialize(await api.doSearch(searchRequest));
}

async function fetchBasicList(type: keyof typeof OBJECT_PROPERTIES, limit: number, after?: string) {
    // Deprecated in favor of searchObjects for sorting
    // But keeping for fallback if needed, though we will migrate away
    return getObjectsByType(type, limit, after, undefined);
}

// Redirecting to new unified search function
async function getObjectsByType(type: keyof typeof OBJECT_PROPERTIES, limit: number, after?: string, query?: string, queryProp?: string) {
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

    const filterGroups = [];
    if (query && queryProp) {
        filterGroups.push({
            filters: [{ propertyName: queryProp, operator: "CONTAINS_TOKEN", value: query }]
        });
    }

    return searchObjects(api, properties, limit, after, filterGroups);
}


export async function getContacts(limit: number = 100, after?: string, query?: string) {
    return getObjectsByType("contacts", limit, after, query, "firstname");
}

export async function getCompanies(limit: number = 100, after?: string, query?: string) {
    return getObjectsByType("companies", limit, after, query, "name");
}

export async function getDeals(limit: number = 100, after?: string, query?: string) {
    return getObjectsByType("deals", limit, after, query, "dealname");
}

export async function getTickets(limit: number = 100, after?: string) {
    // Tickets didn't have search before? Adding it now ensures sorting
    return getObjectsByType("tickets", limit, after, undefined);
}

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

    // Always use searchObjects to ensure sorting
    return searchObjects(
        hubspotClient.crm.products.searchApi,
        OBJECT_PROPERTIES.products,
        limit,
        after,
        filterGroups // if empty, acts like basic list but sorted
    );
}

export async function getQuotes(limit: number = 100, after?: string) {
    return getObjectsByType("quotes", limit, after, undefined);
}

export async function getLineItems(limit: number = 100, after?: string, query?: string) {
    const hubspotClient = await getHubSpotClient();
    let response;

    if (query) {
        const filterGroups = [
            { filters: [{ propertyName: "name", operator: "CONTAINS_TOKEN", value: query }] },
            { filters: [{ propertyName: "hs_sku", operator: "CONTAINS_TOKEN", value: query }] },
            { filters: [{ propertyName: "description", operator: "CONTAINS_TOKEN", value: query }] },
        ];

        response = await searchObjects(
            hubspotClient.crm.lineItems.searchApi,
            OBJECT_PROPERTIES["line-items"],
            limit,
            after,
            filterGroups
        );
    } else {
        // Use searchObjects even for basic list to ensure sort
        response = await searchObjects(
            hubspotClient.crm.lineItems.searchApi,
            OBJECT_PROPERTIES["line-items"],
            limit,
            after,
            []
        );
    }


    // Prepare to fetch associations for each line item


    // However, the node client might not have a strong-typed 'engagements' property on 'crm' if it's older or organized differently.
    // We will use the generic 'objects' API if specific one is missing, or try 'crm.objects.basicApi'.
    // BUT the user snippet showed an endpoint: /crm/v3/objects/engagements/search. 
    // This matches the pattern of other objects.

    // NOTE: The HubSpot Node client often exposes these as 'crm.objects' with a type parameter, 
    // or sometimes specific clients like 'crm.engagements' only exist in newer versions or for v1 legacy.
    // For v3 'objects/engagements', we can usually use the generic request method if the SDK doesn't have a shortcut,
    // OR try to access it via objects.

    // Let's try attempting to use the functionality the user asked for using the client's api request method if possible,
    // or just use valid node SDK methods. 
    // The safest way with the SDK for "engagements" (which are Calls, Emails, Meetings, Tasks, Notes) 
    // is often via `crm.objects.basicApi` specifying "engagements" or specific types.
    // BUT "engagements" as a single object type in v3 is a "unified" view.

    // Given the user specifically requested a Search POST to `.../engagements/search`, 
    // we will implement that. 
    // Since the SDK might not have `crm.engagements`, we'll check if we can use `apiRequest`.





    const lineItems = response.results;

    if (lineItems.length > 0) {
        // Use batch API to fetch associations efficiently
        const inputs = lineItems.map((item: any) => ({ id: item.id }));

        try {
            const [dealsResponse, quotesResponse] = await Promise.all([
                hubspotClient.crm.associations.batchApi.read("line_items", "deals", { inputs }),
                hubspotClient.crm.associations.batchApi.read("line_items", "quotes", { inputs })
            ]);

            console.log("Deals Response Batch:", JSON.stringify(dealsResponse, null, 2));
            console.log("Quotes Response Batch:", JSON.stringify(quotesResponse, null, 2));

            // Create maps for quick lookup
            // Response structure: { status, results: [ { from: { id }, to: [ { id, type } ] } ] }
            // Note: The raw response might use '_from' instead of 'from' depending on client version/serialization
            const getMap = (response: any) => new Map(
                response.results
                    .map((r: any) => {
                        const from = r.from || r._from;
                        if (!from || !from.id) return null;
                        return [from.id, r.to];
                    })
                    .filter((entry: any) => entry !== null)
            );

            const dealsMap = getMap(dealsResponse);
            const quotesMap = getMap(quotesResponse);

            lineItems.forEach((item: any) => {
                // Determine association structure expected by UI (see AssociationsList component)
                // It expects: associations: { [key]: { results: [] } }

                // Using "deals" and "quotes" as keys matches what we did manually
                item.associations = {
                    deals: { results: dealsMap.get(item.id) || [] },
                    quotes: { results: quotesMap.get(item.id) || [] }
                };
            });

        } catch (e: any) {
            console.error("Error fetching batch associations:", e);
            // Fallback to manual fetch if batch fails? Or just return without associations to avoid crash
            // Given the user wants batch api, we assume it works.
        }

        // Ensure all attached association objects are plain JSON (HubSpot client returns class instances)
        response.results = serialize(lineItems);
    }

    return response;
}

export async function getAllProperties(type: string) {
    const hubspotClient = await getHubSpotClient();
    // Normalize type for properties API (line-items -> line_items)
    const objectType = type === "line-items" ? "line_items" : (type === "engagements" ? "engagements" : type);

    try {
        const response = await hubspotClient.crm.properties.coreApi.getAll(objectType);
        return response.results.map((prop: any) => prop.name);
    } catch (e) {
        console.error("Error fetching properties for " + type, e);
        // Fallback for engagements if API fails (it should work for objects/engagements)
        if (type === "engagements") {
            return OBJECT_PROPERTIES.engagements;
        }
        return [];
    }
}

export async function getObject(type: string, id: string) {
    const hubspotClient = await getHubSpotClient();
    // Map type to hubspot client property
    // contacts, companies, deals, tickets, products, quotes, line-items

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
        case "engagements":
            // Engagements don't have a standard batchApi exposed in the same way on older clients
            // We will use a special handling block below
            batchApi = null;
            break;
        default: throw new Error("Invalid object type");
    }

    // Special handling for engagements single retrieval
    if (type === "engagements") {
        return getEngagementObject(hubspotClient, id);
    }

    const properties = await getAllProperties(type);

    // Normalize type for lookup
    const lookupType = type === "line-items" ? "line-items" : type;
    const associationsToFetch = ASSOCIATION_MAP[lookupType] || [];

    // Use batchApi.read (POST) to avoid URL length limits with many properties
    const batchInput = {
        inputs: [{ id }],
        properties,
    };

    console.log(`getObject batchInput for ${type} ${id}:`, JSON.stringify(batchInput, null, 2));

    if (!batchApi) {
        throw new Error(`Batch API not available for type ${type}`);
    }

    const response = await batchApi.read(batchInput as any);
    const result = response.results[0];

    console.log(`getObject result for ${type} ${id}:`, JSON.stringify(result, null, 2));

    if (!result) {
        throw new Error("Object not found");
    }

    // Fetch associations separately
    if (associationsToFetch.length > 0) {
        if (!basicApi) {
            console.warn(`Basic API not available for type ${type}, skipping associations`);
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

// Extracted helpers
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
            case "engagements":
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





// fetchAssociations function removed as it is no longer needed

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

export async function getDashboardStats() {
    const hubspotClient = await getHubSpotClient();

    // Helper for simple count search
    const getCount = async (api: any) => {
        const searchRequest = {
            limit: 1,
            filterGroups: [],
        };
        const response = await api.doSearch(searchRequest);
        return response.total;
    };

    // Sequential execution to avoid 429 Rate Limit errors
    const contactsCount = await getCount(hubspotClient.crm.contacts.searchApi).catch(() => 0);
    const companiesCount = await getCount(hubspotClient.crm.companies.searchApi).catch(() => 0);
    const dealsCount = await getCount(hubspotClient.crm.deals.searchApi).catch(() => 0);
    const ticketsCount = await getCount(hubspotClient.crm.tickets.searchApi).catch(() => 0);
    const productsCount = await getCount(hubspotClient.crm.products.searchApi).catch(() => 0);

    let recentDealsResponse;
    try {
        recentDealsResponse = await hubspotClient.crm.deals.searchApi.doSearch({
            limit: 5,
            sorts: [{ propertyName: "createdate", direction: "DESCENDING" }] as any,
            filterGroups: [],
            properties: ["dealname", "amount", "dealstage", "createdate"],
        });
    } catch (e) {
        console.error("Error fetching recent deals:", e);
        recentDealsResponse = { results: [] };
    }
    return {
        counts: {
            contacts: contactsCount,
            companies: companiesCount,
            deals: dealsCount,
            tickets: ticketsCount,
            products: productsCount,
        },
        recentDeals: serialize(recentDealsResponse.results),
    };
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete(REFRESH_TOKEN_COOKIE);
    cookieStore.delete(COOKIE_NAME);
    cookieStore.delete(EXPIRES_IN_COOKIE);
}

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
