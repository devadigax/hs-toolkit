"use server";

import { getHubSpotClient } from "@/lib/hubspot-server";
import { getErrorMessage } from "@/lib/utils";

type EngagementSearchResult = {
    id: string;
    properties?: {
        hs_engagement_type?: string | null;
    };
};

type EngagementSearchResponse = {
    message?: string;
    results?: EngagementSearchResult[];
    paging?: {
        next?: {
            after?: string;
        };
    };
};

type ErrorPayload = {
    message?: string;
};

// Helper to get correct singular association property name
function getAssociationProperty(pluralType: string): string {
    const map: Record<string, string> = {
        "contacts": "contact",
        "companies": "company",
        "deals": "deal",
        "tickets": "ticket",
        "quotes": "quote",
        "products": "product",
    };
    return map[pluralType] || pluralType; // Fallback to original if not found (e.g. custom objects might be different)
}

// Helper to map engagement type to V4 object type
function getV4ObjectType(engagementType?: string | null): string {
    if (!engagementType) return "notes"; // default?
    switch (engagementType) {
        case "NOTE": return "notes";
        case "CALL": return "calls";
        case "EMAIL":
        case "INCOMING_EMAIL":
        case "FORWARDED_EMAIL":
            return "emails";
        case "MEETING": return "meetings";
        case "TASK": return "tasks";
        default: return "notes"; // Fallback or maybe 'communications'
    }
}

export async function copyObjectEngagements(objectType: string, sourceId: string, targetId: string, shouldDeleteFromSource: boolean = false) {
    if (!sourceId || !targetId || !objectType) {
        return { success: false, message: "Object Type, Source ID, and Target ID are required." };
    }

    try {
        const hubspotClient = await getHubSpotClient();
        const associationProp = `associations.${getAssociationProperty(objectType)}`;

        console.log(`[CopyEngagements] Searching for engagements on ${objectType} (${associationProp}) = ${sourceId}`);

        // 1. Search for engagements associated with the source object
        let allEngagements: EngagementSearchResult[] = [];
        let after: string | undefined = undefined;
        let hasMore = true;

        while (hasMore) {
            const searchRequest: Record<string, unknown> = {
                filters: [
                    {
                        propertyName: associationProp, // "associations.deal" etc.
                        operator: "EQ",
                        value: sourceId,
                    },
                ],
                properties: ["hs_engagement_type"], // Fetched to determine specific type
                limit: 100,
            };

            if (after) {
                searchRequest.after = after;
            }

            const searchResponse = await hubspotClient.apiRequest({
                method: 'POST',
                path: '/crm/v3/objects/engagements/search',
                body: searchRequest,
            });

            const searchResult = await searchResponse.json() as EngagementSearchResponse;

            if (!searchResponse.ok) {
                console.error("[CopyEngagements] Search failed:", searchResult);
                throw new Error(searchResult.message || "Failed to search engagements");
            }

            const results = searchResult.results || [];
            allEngagements = allEngagements.concat(results);

            if (searchResult.paging?.next?.after) {
                after = searchResult.paging.next.after;
            } else {
                hasMore = false;
            }
        }

        console.log(`[CopyEngagements] Found ${allEngagements.length} engagements.`);

        if (allEngagements.length === 0) {
            return { success: true, message: `No engagements found on the source ${objectType}.` };
        }

        // 2. Group by V4 Object Type
        const engagementsByType: Record<string, string[]> = {};
        allEngagements.forEach((eng) => {
            const type = getV4ObjectType(eng.properties?.hs_engagement_type);
            if (!engagementsByType[type]) {
                engagementsByType[type] = [];
            }
            engagementsByType[type].push(eng.id);
        });

        // 3. Batch associate for each type
        const BATCH_SIZE = 100;
        let successCount = 0;

        const failureReasons: string[] = [];

        for (const [v4Type, ids] of Object.entries(engagementsByType)) {
            console.log(`[CopyEngagements] Associating ${ids.length} ${v4Type} to ${objectType} ${targetId}`);

            for (let i = 0; i < ids.length; i += BATCH_SIZE) {
                const batch = ids.slice(i, i + BATCH_SIZE);
                const associationInputs = batch.map((id: string) => ({
                    from: { id },
                    to: { id: targetId }
                }));

                const associationRequest = {
                    inputs: associationInputs,
                };

                const response = await hubspotClient.apiRequest({
                    method: 'POST',
                    path: `/crm/v4/associations/${v4Type}/${objectType}/batch/associate/default`,
                    body: associationRequest,
                });

                if (!response.ok) {
                    const responseText = await response.text();
                    let errorDetails;
                    try {
                        errorDetails = JSON.parse(responseText);
                    } catch {
                        errorDetails = responseText;
                    }
                    const errorMessage = typeof errorDetails === "object" && errorDetails !== null && "message" in errorDetails ? String((errorDetails as ErrorPayload).message) : JSON.stringify(errorDetails);
                    console.error(`[CopyEngagements] Failed to associate ${v4Type} (Status: ${response.status}):`, errorDetails);
                    failureReasons.push(`${v4Type}: ${errorMessage}`);
                    continue;
                }

                successCount += batch.length;
            }
        }

        let message = `Successfully copied ${successCount} engagement(s) to ${objectType} ${targetId}.`;
        if (failureReasons.length > 0) {
            message += ` Failures: ${failureReasons.join("; ")}`;
        }

        // 4. If "Move" (Delete from source), unlink from source
        if (shouldDeleteFromSource && successCount > 0) {
            // Unlink explicitly using the V4 types as well for robustness
            for (const [v4Type, ids] of Object.entries(engagementsByType)) {
                for (let i = 0; i < ids.length; i += BATCH_SIZE) {
                    const batch = ids.slice(i, i + BATCH_SIZE);
                    const archiveRequest = {
                        inputs: batch.map(id => ({
                            from: { id },
                            to: [{ id: sourceId }]
                        })),
                    };

                    const response = await hubspotClient.apiRequest({
                        method: 'POST',
                        path: `/crm/v4/associations/${v4Type}/${objectType}/batch/archive`,
                        body: archiveRequest,
                    });
                    if (!response.ok) {
                        const error = await response.json();
                        console.error(`[CopyEngagements] Failed to unlink ${v4Type}:`, error);
                    }
                }
            }
            message += ` And unlinked from source ${sourceId}.`;
        }

        return {
            success: successCount > 0,
            message: message
        };

    } catch (error: unknown) {
        console.error("Error copying/moving engagements:", error);
        return {
            success: false,
            message: getErrorMessage(error) || "An error occurred while processing engagements."
        };
    }
}

export async function unlinkObjectEngagements(objectType: string, objectId: string, specificEngagementIds?: string[]) {
    if (!objectId || !objectType) {
        return { success: false, message: "Object Type and Object ID are required." };
    }

    try {
        const hubspotClient = await getHubSpotClient();
        let allEngagements: EngagementSearchResult[] = []; // Store full objects to get types if needed

        // If specific IDs are passed, we might need to fetch them to get their types 
        // OR we make the caller pass the objects/types.
        // For simplicity, if IDs are passed from "Copy" (which has types), we *could* have passed types.
        // But to keep it simple, let's just Re-search if we don't know types, or try to "guess" / try all types?
        // Trying all types on a list of IDs is inefficient.
        //
        // OPTIMIZATION: If specificEngagementIds is passed, we can batch read them to get types.
        // OR, the caller `copyObjectEngagements` already knows the types, so it should probably handle the unlinking itself 
        // (which I implemented in text above).
        //
        // So this function `unlinkObjectEngagements` is primarily for the UI "Unlink" button which starts from scratch.
        // So we will search for everything.

        // If specific IDs matches are empty, search.
        if (!specificEngagementIds || specificEngagementIds.length === 0) {
            const associationProp = `associations.${getAssociationProperty(objectType)}`;
            console.log(`[UnlinkEngagements] Searching for engagements on ${objectType} (${associationProp}) = ${objectId}`);

            let after: string | undefined = undefined;
            let hasMore = true;

            while (hasMore) {
                const searchRequest: Record<string, unknown> = {
                    filters: [
                        {
                            propertyName: associationProp,
                            operator: "EQ",
                            value: objectId,
                        },
                    ],
                    properties: ["hs_engagement_type"],
                    limit: 100,
                };

                if (after) {
                    searchRequest.after = after;
                }

                const searchResponse = await hubspotClient.apiRequest({
                    method: 'POST',
                    path: '/crm/v3/objects/engagements/search',
                    body: searchRequest,
                });

                const searchResult = await searchResponse.json() as EngagementSearchResponse;

                if (!searchResponse.ok) {
                    console.error("[UnlinkEngagements] Search failed:", searchResult);
                    throw new Error(searchResult.message || "Failed to search engagements");
                }

                const results = searchResult.results || [];
                allEngagements = allEngagements.concat(results);

                if (searchResult.paging?.next?.after) {
                    after = searchResult.paging.next.after;
                } else {
                    hasMore = false;
                }
            }
        } else {
            // We have IDs but no types. We must fetch them.
            // POST /crm/v3/objects/engagements/batch/read
            const batchReadResponse = await hubspotClient.apiRequest({
                method: 'POST',
                path: '/crm/v3/objects/engagements/batch/read',
                body: {
                    inputs: specificEngagementIds.map(id => ({ id })),
                    properties: ["hs_engagement_type"]
                }
            });
            const batchData = await batchReadResponse.json() as EngagementSearchResponse;
            allEngagements = batchData.results || [];
        }

        console.log(`[UnlinkEngagements] Found ${allEngagements.length} engagements to unlink.`);

        if (allEngagements.length === 0) {
            return { success: true, message: "No engagements found to unlink." };
        }

        // Group by V4 Object Type
        const engagementsByType: Record<string, string[]> = {};
        allEngagements.forEach((eng) => {
            const type = getV4ObjectType(eng.properties?.hs_engagement_type);
            if (!engagementsByType[type]) {
                engagementsByType[type] = [];
            }
            engagementsByType[type].push(eng.id);
        });

        // Batch unlink (archive association)
        const BATCH_SIZE = 100;
        let successCount = 0;

        for (const [v4Type, ids] of Object.entries(engagementsByType)) {
            for (let i = 0; i < ids.length; i += BATCH_SIZE) {
                const batch = ids.slice(i, i + BATCH_SIZE);

                const archiveRequest = {
                    inputs: batch.map(id => ({
                        from: { id },
                        to: [{ id: objectId }]
                    })),
                };

                // ... (inside unlinkObjectEngagements loop)
                const response = await hubspotClient.apiRequest({
                    method: 'POST',
                    path: `/crm/v4/associations/${v4Type}/${objectType}/batch/archive`,
                    body: archiveRequest,
                });

                if (response.ok) {
                    successCount += batch.length;
                } else {
                    const responseText = await response.text();
                    let errorDetails;
                    try {
                        errorDetails = JSON.parse(responseText);
                    } catch {
                        errorDetails = responseText;
                    }
                    console.error(`[UnlinkEngagements] Failed to unlink ${v4Type} (Status: ${response.status}):`, errorDetails);
                }
            }
        }

        return {
            success: true,
            message: `Successfully unlinked ${successCount} engagement(s) from ${objectType} ${objectId}.`
        };

    } catch (error: unknown) {
        console.error("Error unlinking engagements:", error);
        return {
            success: false,
            message: getErrorMessage(error) || "An error occurred while unlinking engagements."
        };
    }
}

export async function associateObjects(
    fromObjectType: string,
    fromObjectId: string,
    toObjectType: string,
    toObjectId: string
) {
    if (!fromObjectId || !toObjectId || !fromObjectType || !toObjectType) {
        return { success: false, message: "All fields are required." };
    }

    try {
        const hubspotClient = await getHubSpotClient();

        // API Endpoint format: /crm/v4/associations/{fromObjectType}/{toObjectType}/batch/associate/default
        // Note: For custom objects or specific association types, 'default' might not be enough, 
        // but for standard objects (contact <-> deal, etc.), it usually works or requires a specific ID.
        // We will try 'default' first.

        const associationRequest = {
            inputs: [
                {
                    from: { id: fromObjectId },
                    to: { id: toObjectId }
                }
            ]
        };

        console.log(`[AssociateObjects] Associating ${fromObjectType} ${fromObjectId} with ${toObjectType} ${toObjectId}`);

        const response = await hubspotClient.apiRequest({
            method: 'POST',
            path: `/crm/v4/associations/${fromObjectType}/${toObjectType}/batch/associate/default`,
            body: associationRequest,
        });

        if (!response.ok) {
            const responseText = await response.text();
            let errorDetails;
            try {
                errorDetails = JSON.parse(responseText);
            } catch {
                errorDetails = responseText;
            }
            console.error(`[AssociateObjects] Association failed (Status: ${response.status}):`, errorDetails);
            throw new Error(typeof errorDetails === "object" && errorDetails !== null && "message" in errorDetails ? String((errorDetails as ErrorPayload).message) : `Failed to associate objects (Status: ${response.status})`);
        }

        return {
            success: true,
            message: `Successfully associated ${fromObjectType} ${fromObjectId} with ${toObjectType} ${toObjectId}.`
        };

    } catch (error: unknown) {
        console.error("Error associating objects:", error);
        return {
            success: false,
            message: getErrorMessage(error) || "An error occurred while associating objects."
        };
    }
}

export async function linkDealToLineItem(dealId: string, lineItemId: string) {
    if (!dealId || !lineItemId) {
        return { success: false, message: "Deal ID and Line Item ID are required." };
    }

    try {
        const hubspotClient = await getHubSpotClient();

        const associationRequest = {
            inputs: [
                {
                    from: { id: dealId },
                    to: { id: lineItemId }
                }
            ]
        };

        const response = await hubspotClient.apiRequest({
            method: 'POST',
            path: '/crm/v4/associations/deals/line_items/batch/associate/default',
            body: associationRequest,
        });

        if (!response.ok) {
            const responseText = await response.text();
            let errorDetails;
            try { errorDetails = JSON.parse(responseText); } catch { errorDetails = responseText; }
            throw new Error(typeof errorDetails === 'object' && errorDetails.message ? errorDetails.message : `Failed to link Deal to Line Item (Status: ${response.status})`);
        }

        return { success: true, message: `Successfully linked Deal ${dealId} to Line Item ${lineItemId}.` };
    } catch (error: unknown) {
        console.error("Error linking deal to line item:", error);
        return { success: false, message: error instanceof Error ? error.message : "An error occurred while linking." };
    }
}

export async function unlinkDealFromLineItem(dealId: string, lineItemId: string) {
    if (!dealId || !lineItemId) {
        return { success: false, message: "Deal ID and Line Item ID are required." };
    }

    try {
        const hubspotClient = await getHubSpotClient();

        const archiveRequest = {
            inputs: [
                {
                    from: { id: dealId },
                    to: [{ id: lineItemId }]
                }
            ]
        };

        const response = await hubspotClient.apiRequest({
            method: 'POST',
            path: '/crm/v4/associations/deals/line_items/batch/archive',
            body: archiveRequest,
        });

        if (!response.ok) {
            const responseText = await response.text();
            let errorDetails;
            try { errorDetails = JSON.parse(responseText); } catch { errorDetails = responseText; }
            throw new Error(typeof errorDetails === 'object' && errorDetails.message ? errorDetails.message : `Failed to unlink Deal from Line Item (Status: ${response.status})`);
        }

        return { success: true, message: `Successfully unlinked Deal ${dealId} from Line Item ${lineItemId}.` };
    } catch (error: unknown) {
        console.error("Error unlinking deal from line item:", error);
        return { success: false, message: error instanceof Error ? error.message : "An error occurred while unlinking." };
    }
}
