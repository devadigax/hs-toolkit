import { getEngagements, getAllProperties } from "@/lib/actions";
import { Search } from "@/components/ui/search";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { EngagementsTable } from "./engagements-table";
import { ActivityTypeFilter } from "@/components/dashboard/activity-type-filter";
import { formatDateForDisplay, getErrorMessage } from "@/lib/utils";
import type { HubSpotObject, SearchResult } from "@/types/hubspot";

type EngagementProperties = Record<string, string | number | boolean | null | undefined>;

export default async function EngagementsPage({
    searchParams,
}: {
    searchParams: Promise<{
        query?: string;
        after?: string;
        searchField?: string;
        activityType?: string;
    }>;
}) {
    const { query = "", after, searchField, activityType } = await searchParams;

    try {
        const [response, allProperties] = await Promise.all([
            getEngagements(100, after, query, searchField, activityType),
            getAllProperties("engagements")
        ]) as [SearchResult<HubSpotObject>, string[]];

        const nextCursor = response.paging?.next?.after;

        const getSubject = (props: EngagementProperties) => {
            if (props.hs_task_subject) return props.hs_task_subject;
            if (props.hs_meeting_title) return props.hs_meeting_title;
            if (props.hs_note_body && typeof props.hs_note_body === "string") return props.hs_note_body.replace(/<[^>]*>?/gm, "").substring(0, 50) + "...";
            if (props.hs_body_preview) return props.hs_body_preview;
            return "No Subject";
        };

        const engagements = response.results.map((item: HubSpotObject) => {
            return {
                ...item,
                activityType: item.properties.hs_engagement_type,
                subject: getSubject(item.properties),
                hs_task_status: item.properties.hs_task_status || "-",
                formattedDate: typeof item.properties.hs_timestamp === "string" || typeof item.properties.hs_timestamp === "number"
                    ? format(new Date(item.properties.hs_timestamp), "MMM d, yyyy h:mm a")
                    : "-",
                lastModifiedAt: formatDateForDisplay(item.properties.lastmodifieddate),
                source: item.properties.hs_object_source || "-"
            };
        });

        return (
            <div className="flex-1 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-3xl font-bold tracking-tight">Engagements</h2>
                    <div className="flex items-center space-x-2">
                        <ActivityTypeFilter />
                        <Search placeholder="Search activity..." properties={allProperties} />
                    </div>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <EngagementsTable data={engagements} nextCursor={nextCursor} />
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
                Error loading engagements: {message}
            </div>
        )
    }
}
