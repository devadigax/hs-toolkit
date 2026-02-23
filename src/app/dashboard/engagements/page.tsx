import { Suspense } from "react";
import { getEngagements, getAllProperties } from "@/lib/actions";
import { DataTable } from "@/components/ui/data-table";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Search } from "@/components/ui/search";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default async function EngagementsPage({
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
            getEngagements(100, after, query, searchField),
            getAllProperties("engagements")
        ]);

        const nextCursor = response.paging?.next?.after;

        const formatType = (type: string) => {
            return type ? type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) : "Unknown";
        };

        const getSubject = (props: any) => {
            if (props.hs_task_subject) return props.hs_task_subject;
            if (props.hs_meeting_title) return props.hs_meeting_title;
            if (props.hs_note_body) return props.hs_note_body.replace(/<[^>]*>?/gm, '').substring(0, 50) + "..."; // Strip HTML for notes
            if (props.hs_body_preview) return props.hs_body_preview;
            return "No Subject";
        };

        const getTypeColor = (type: string) => {
            switch (type) {
                case "EMAIL": return "default"; // dark
                case "CALL": return "secondary"; // gray
                case "MEETING": return "secondary"; // gray
                case "TASK": return "outline"; // white/border
                case "NOTE": return "outline";
                default: return "secondary";
            }
        };

        const engagements = response.results.map((item: any) => {
            return {
                ...item,
                activityType: item.properties.hs_engagement_type,
                subject: getSubject(item.properties),
                hs_task_status: item.properties.hs_task_status || "-",
                formattedDate: item.properties.hs_timestamp ? format(new Date(item.properties.hs_timestamp), "MMM d, yyyy h:mm a") : "-",
                lastModifiedAt: item.properties.lastmodifieddate ? new Date(item.properties.lastmodifieddate).toLocaleDateString() : "-",
                source: item.properties.hs_object_source || "-"
            };
        });

        const columns = [
            {
                header: "Activity Type",
                accessorKey: "activityType",
                cell: (row: any) => (
                    <Badge variant={getTypeColor(row.properties.hs_engagement_type) as any}>
                        {formatType(row.properties.hs_engagement_type)}
                    </Badge>
                )
            },
            {
                header: "Subject / Body",
                accessorKey: "subject",
                cell: (row: any) => (
                    <Link href={`/dashboard/engagements/${row.id}`} className="hover:underline font-medium text-blue-600 dark:text-blue-400">
                        {row.subject}
                    </Link>
                )
            },
            { header: "Task Status", accessorKey: "hs_task_status", hiddenByDefault: true },
            { header: "Date", accessorKey: "formattedDate" },
            { header: "Last Modified", accessorKey: "lastModifiedAt", hiddenByDefault: true },
            { header: "Source", accessorKey: "source", hiddenByDefault: true }
        ];

        return (
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Engagements</h2>
                </div>
                <div className="flex items-center space-x-2">
                    <Search placeholder="Search activity..." properties={allProperties} />
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DataTable data={engagements} columns={columns} />
                        <PaginationControls nextCursor={nextCursor} />
                    </CardContent>
                </Card>
            </div>
        );
    } catch (error: any) {
        if (error.message && error.message.includes("No value for refresh token found")) {
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
                Error loading engagements: {error.message || "Unknown error"}
            </div>
        )
    }
}
