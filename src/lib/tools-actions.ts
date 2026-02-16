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

            const searchResult = await searchResponse.json();
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
        // HubSpot v4 batch association limit is likely 100 or 1000, 
        // to be safe and consistent with the user request, we use 100.
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
                method: 'POST',
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
