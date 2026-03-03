"use server";

import { getHubSpotClient } from "@/lib/hubspot-server";
import { serialize } from "@/lib/utils";
import { updateTag } from "next/cache";

export async function getMarketingEvents(limit: number = 100, after?: string) {
    const client = await getHubSpotClient();
    const query = new URLSearchParams({ limit: limit.toString() });
    if (after) query.set("after", after);

    const response = await client.apiRequest({
        method: 'GET',
        path: `/marketing/v3/marketing-events?${query.toString()}`
    });

    const result = (await response.json()) as any;
    return serialize(result);
}

export async function getMarketingEventByObjectId(objectId: string) {
    const client = await getHubSpotClient();
    try {
        const response = await client.apiRequest({
            method: 'GET',
            path: `/marketing/v3/marketing-events/${objectId}`
        });
        const result = (await response.json()) as any;

        return serialize({
            id: result.objectId || result.externalEventId || objectId,
            properties: { ...result },
            externalEventId: result.externalEventId,
            appInfo: result.appInfo
        });
    } catch (error) {
        throw new Error("Marketing Event not found");
    }
}

export async function createMarketingEvent(properties: Record<string, string>) {
    const client = await getHubSpotClient();

    // required fields for API: eventName, externalAccountId, externalEventId
    const body = {
        eventName: properties.eventName || "New Event",
        externalAccountId: properties.externalAccountId || "test-acc-1",
        externalEventId: properties.externalEventId || `ext-${Date.now()}`,
        startDateTime: properties.startDateTime || new Date().toISOString(),
        endDateTime: properties.endDateTime || new Date().toISOString(),
        eventOrganizer: properties.eventOrganizer || "Organizer",
        eventType: properties.eventType || "WEBINAR",
        eventDescription: properties.eventDescription || ""
    };

    try {
        const response = await client.apiRequest({
            method: 'POST',
            path: '/marketing/v3/marketing-events/events',
            body
        });

        const result = (await response.json()) as any;
        if (result.status === 'error') throw new Error(result.message);

        updateTag(`events-list`);
        return { success: true, data: serialize(result) };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateMarketingEventReq(objectId: string, properties: Record<string, string>) {
    const client = await getHubSpotClient();

    try {
        const response = await client.apiRequest({
            method: 'PATCH',
            path: `/marketing/v3/marketing-events/${objectId}`,
            body: properties
        });

        const result = (await response.json()) as any;
        if (result.status === 'error') throw new Error(result.message);

        updateTag(`events-list`);
        updateTag(`events-${objectId}`);
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
