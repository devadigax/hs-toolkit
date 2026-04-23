import { getObjectsByType, getAllProperties } from "@/lib/actions";
import { DataTable } from "@/components/ui/data-table";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Search } from "@/components/ui/search";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshObjectButton } from "@/components/dashboard/refresh-object-button";
import { CreateRecordDialog } from "@/components/dashboard/create-record-dialog";
import { formatDateForDisplay, getErrorMessage } from "@/lib/utils";
import type { MarketingEvent, MarketingEventsResponse } from "@/types/hubspot";

export default async function MarketingEventsPage({
    searchParams,
}: {
    searchParams: Promise<{
        query?: string;
        after?: string;
        searchField?: string;
    }>;
}) {
    const { query = "", after, searchField } = await searchParams;

    try {
        const [response, allProperties] = await Promise.all([
            getObjectsByType("events", 100, after, query, undefined, searchField),
            getAllProperties("events")
        ]) as [MarketingEventsResponse, string[]];

        const events = response.results.map((event) => {
            const record = event as MarketingEvent;
            return {
                id: record.objectId || record.externalEventId,
                eventName: record.eventName || "-",
                eventStatus: record.eventStatus || "-",
                eventType: record.eventType || "-",
                eventOrganizer: record.eventOrganizer || "-",
                startDateTime: formatDateForDisplay(record.startDateTime),
                endDateTime: formatDateForDisplay(record.endDateTime),
                createdAt: formatDateForDisplay(record.createdAt),
                externalAccountId: record.appInfo ? record.appInfo.id : "-"
            };
        });

        const nextCursor = response.paging?.next?.after;

        const columns = [
            { header: "Event Name", accessorKey: "eventName" },
            { header: "Status", accessorKey: "eventStatus" },
            { header: "Type", accessorKey: "eventType" },
            { header: "Organizer", accessorKey: "eventOrganizer" },
            { header: "Start Date", accessorKey: "startDateTime" },
            { header: "End Date", accessorKey: "endDateTime", hiddenByDefault: true },
            { header: "Created At", accessorKey: "createdAt", hiddenByDefault: true },
            { header: "App ID", accessorKey: "externalAccountId", hiddenByDefault: true },
        ];

        return (
            <div className="flex-1 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-3xl font-bold tracking-tight">Marketing Events</h2>
                    <div className="flex items-center space-x-2">
                        <Search placeholder="Search events..." properties={allProperties} />
                        <CreateRecordDialog type="events" triggerLabel="Create Event" />
                        <RefreshObjectButton objectType="events" />
                    </div>
                </div>
                <Card>
                    <CardContent className="pt-6">
                        <DataTable title="All Marketing Events" data={events} columns={columns} clickableColumn="eventName" />
                        <PaginationControls nextCursor={nextCursor} />
                    </CardContent>
                </Card>
            </div>
        );
    } catch (error: unknown) {
        const message = getErrorMessage(error);
        if (message.includes("No value for refresh token found")) {
            return (
                <div className="flex flex-col items-center justify-center p-8 text-center text-red-500">
                    <p>Authentication Failed. please login again.</p>
                    <div className="mt-4">
                        <a href="/api/auth/login" className="text-blue-500 hover:underline">Login with HubSpot</a>
                    </div>
                </div>
            )
        }

        return (
                <div className="p-8 text-red-500">
                Error loading marketing events: {message}
            </div>
        )
    }
}
