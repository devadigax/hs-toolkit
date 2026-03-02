import { getTickets, getAllProperties } from "@/lib/actions";
import { DataTable } from "@/components/ui/data-table";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Search } from "@/components/ui/search";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshObjectButton } from "@/components/dashboard/refresh-object-button";
import { DeletedRecordsView } from "@/components/dashboard/deleted-records-view";
import { CreateRecordDialog } from "@/components/dashboard/create-record-dialog";

export default async function TicketsPage({
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
            getTickets(100, after, query, searchField),
            getAllProperties("tickets")
        ]);
        const tickets = response.results.map((ticket: any) => ({
            ...ticket,
            subject: ticket.properties.subject || ticket.id,
            content: ticket.properties.content || "",
            hs_pipeline: ticket.properties.hs_pipeline || "",
            hs_pipeline_stage: ticket.properties.hs_pipeline_stage || "",
            hs_ticket_priority: ticket.properties.hs_ticket_priority || "",
            hs_ticket_category: ticket.properties.hs_ticket_category || "",
            createdAt: ticket.properties.createdate ? new Date(ticket.properties.createdate).toLocaleDateString() : "-",
            lastModifiedAt: ticket.properties.lastmodifieddate ? new Date(ticket.properties.lastmodifieddate).toLocaleDateString() : "-",
            source: ticket.properties.hs_object_source || "-"
        }));
        const nextCursor = response.paging?.next?.after;

        const columns = [
            { header: "Subject", accessorKey: "subject" },
            { header: "Priority", accessorKey: "hs_ticket_priority", hiddenByDefault: true },
            { header: "Category", accessorKey: "hs_ticket_category", hiddenByDefault: true },
            { header: "Content", accessorKey: "content", hiddenByDefault: true },
            { header: "Pipeline", accessorKey: "hs_pipeline", hiddenByDefault: true },
            { header: "Stage", accessorKey: "hs_pipeline_stage" },
            { header: "Created At", accessorKey: "createdAt" },
            { header: "Last Modified", accessorKey: "lastModifiedAt", hiddenByDefault: true },
            { header: "Source", accessorKey: "source", hiddenByDefault: true },
        ];

        return (
            <div className="flex-1 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-3xl font-bold tracking-tight">Tickets</h2>
                    <div className="flex items-center space-x-2">
                    <Search placeholder="Search tickets..." properties={allProperties} />
                    <CreateRecordDialog type="tickets" />
                    <RefreshObjectButton objectType="tickets" />
                    <DeletedRecordsView objectType="tickets" />
                </div>
                </div>
                <Card>
                    <CardContent className="pt-6">
                        <DataTable title="All Tickets" data={tickets} columns={columns} />
                        <PaginationControls nextCursor={nextCursor} />
                    </CardContent>
                </Card>
            </div>
        );
    } catch (error: any) {
        return <div className="p-8 text-red-500">Error: {error.message}</div>;
    }
}
