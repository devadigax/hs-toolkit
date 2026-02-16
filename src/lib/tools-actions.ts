"use server";

import { getHubSpotClient } from "@/lib/hubspot-server";

export async function copyDealEngagements(sourceDealId: string, targetDealId: string) {
    if (!sourceDealId || !targetDealId) {
        return { success: false, message: "Source and Target Deal IDs are required." };
    }

    try {
        const hubspotClient = await getHubSpotClient();

        // 1. Search for engagements associated with the source deal (with pagination)
        let allEngagements: any[] = [];
        let after: string | undefined = undefined;
        let hasMore = true;

        while (hasMore) {
            const searchRequest: any = {
                filters: [
                    {
                        propertyName: "associations.deal",
                        operator: "EQ",
                        value: sourceDealId,
                    },
                ],
                properties: [],
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

            const searchResult: any = await searchResponse.json();
            const results = searchResult.results || [];
            allEngagements = allEngagements.concat(results);

            if (searchResult.paging?.next?.after) {
                after = searchResult.paging.next.after;
            } else {
                hasMore = false;
            }
        }

        if (allEngagements.length === 0) {
            return { success: true, message: "No engagements found on the source deal." };
        }

        const engagementIds = allEngagements.map((e: any) => e.id);

        // 2. Batch associate engagements with the target deal
        const BATCH_SIZE = 100;

        for (let i = 0; i < engagementIds.length; i += BATCH_SIZE) {
            const batch = engagementIds.slice(i, i + BATCH_SIZE);
            const associationInputs = batch.map((id: string) => ({
                from: { id },
                to: { id: targetDealId }
            }));

            const associationRequest = {
                inputs: associationInputs,
            };

            await hubspotClient.apiRequest({
                method: 'PUT',
                path: '/crm/v4/associations/engagements/deals/batch/associate/default',
                body: associationRequest,
            });
        }

        return {
            success: true,
            message: `Successfully copied ${allEngagements.length} engagement(s) to deal ${targetDealId}.`
        };

    } catch (error: any) {
        console.error("Error copying deal engagements:", error);
        return {
            success: false,
            message: error.message || "An error occurred while copying engagements."
        };
    }
}

export async function unlinkDealEngagements(dealId: string) {
    if (!dealId) {
        return { success: false, message: "Deal ID is required." };
    }

    try {
        const hubspotClient = await getHubSpotClient();
        let allEngagementIds: string[] = [];
        let after: string | undefined = undefined;
        let hasMore = true;

        // 1. Search for all engagements associated with this deal
        while (hasMore) {
            const searchRequest: any = {
                filters: [
                    {
                        propertyName: "associations.deal",
                        operator: "EQ",
                        value: dealId,
                    },
                ],
                properties: [],
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

            const searchResult: any = await searchResponse.json();
            const results = searchResult.results || [];
            allEngagementIds = allEngagementIds.concat(results.map((r: any) => r.id));

            if (searchResult.paging?.next?.after) {
                after = searchResult.paging.next.after;
            } else {
                hasMore = false;
            }
        }

        if (allEngagementIds.length === 0) {
            return { success: true, message: "No engagements found to unlink." };
        }

        // 2. Batch unlink (archive association)
        const BATCH_SIZE = 100;

        for (let i = 0; i < allEngagementIds.length; i += BATCH_SIZE) {
            const batch = allEngagementIds.slice(i, i + BATCH_SIZE);

            const archiveRequest = {
                inputs: batch.map(id => ({
                    from: { id },
                    to: [{ id: dealId }]
                })),
            };

            await hubspotClient.apiRequest({
                method: 'POST',
                path: '/crm/v4/associations/engagements/deals/batch/archive',
                body: archiveRequest,
            });
        }

        return {
            success: true,
            message: `Successfully unlinked ${allEngagementIds.length} engagement(s) from deal ${dealId}.`
        };

    } catch (error: any) {
        console.error("Error unlinking deal engagements:", error);
        return {
            success: false,
            message: error.message || "An error occurred while unlinking engagements."
        };
    }
}
