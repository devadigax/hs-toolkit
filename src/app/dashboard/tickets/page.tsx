import { getTickets } from "@/lib/actions";
import { DataTable } from "@/components/ui/data-table";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function TicketsPage({
    searchParams,
}: {
    searchParams: Promise<{
        after?: string;
    }>;
}) {
    const { after } = await searchParams;

    try {
        const response = await getTickets(100, after);
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
