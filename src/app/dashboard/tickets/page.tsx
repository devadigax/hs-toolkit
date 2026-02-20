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
            createdAt: ticket.properties.createdate ? new Date(ticket.properties.createdate).toLocaleDateString() : "-"
        }));
        const nextCursor = response.paging?.next?.after;

        const columns = [
            { header: "Subject", accessorKey: "subject" },
            { header: "Content", accessorKey: "content" },
            { header: "Stage", accessorKey: "hs_pipeline_stage" },
            { header: "Created At", accessorKey: "createdAt" },
        ];

        return (
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Tickets</h2>
                </div>
                <div className="flex items-center space-x-2">
                    <Search placeholder="Search tickets..." properties={allProperties} />
                    <CreateRecordDialog type="tickets" />
                    <RefreshObjectButton objectType="tickets" />
                    <DeletedRecordsView objectType="tickets" />
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>All Tickets</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DataTable data={tickets} columns={columns} />
                        <PaginationControls nextCursor={nextCursor} />
                    </CardContent>
                </Card>
            </div>
        );
    } catch (error: any) {
        return <div className="p-8 text-red-500">Error: {error.message}</div>;
    }
}
