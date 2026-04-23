"use server";

import { getHubSpotClient } from "@/lib/hubspot-server";
import { getErrorMessage, serialize } from "@/lib/utils";
import { updateTag } from "next/cache";
import type { MarketingEvent, MarketingEventsResponse } from "@/types/hubspot";

export async function getMarketingEvents(limit: number = 100, after?: string) {
    const client = await getHubSpotClient();
    const query = new URLSearchParams({ limit: limit.toString() });
    if (after) query.set("after", after);

    query.set("sort", "-startDateTime");

    const response = await client.apiRequest({
        method: 'GET',
        path: `/marketing/v3/marketing-events?${query.toString()}`
    });

    const result = (await response.json()) as MarketingEventsResponse;

    if (result.results && Array.isArray(result.results)) {
        result.results.sort((a: MarketingEvent, b: MarketingEvent) => {
            const dateA = new Date(a.startDateTime || a.createdAt || 0).getTime();
            const dateB = new Date(b.startDateTime || b.createdAt || 0).getTime();
            return dateB - dateA;
        });
    }

    return serialize(result);
}

export async function getMarketingEventByObjectId(objectId: string) {
    const client = await getHubSpotClient();
    try {
        const response = await client.apiRequest({
            method: 'GET',
            path: `/marketing/v3/marketing-events/${objectId}`
        });
        const result = (await response.json()) as MarketingEvent;

        return serialize({
            id: result.objectId || result.externalEventId || objectId,
            properties: { ...result },
            externalEventId: result.externalEventId,
            appInfo: result.appInfo
        });
    } catch {
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

        const result = (await response.json()) as { status?: string; message?: string };
        if (result.status === 'error') throw new Error(result.message);

        updateTag(`events-list`);
        return { success: true, data: serialize(result) };
    } catch (error: unknown) {
        return { success: false, error: getErrorMessage(error) };
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

        const result = (await response.json()) as { status?: string; message?: string };
        if (result.status === 'error') throw new Error(result.message);

        updateTag(`events-list`);
        updateTag(`events-${objectId}`);
        return { success: true };
    } catch (error: unknown) {
        return { success: false, error: getErrorMessage(error) };
    }
}
