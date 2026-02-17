import { getDeals } from "@/lib/actions";
import { DataTable } from "@/components/ui/data-table";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Search } from "@/components/ui/search";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshObjectButton } from "@/components/dashboard/refresh-object-button";
import { DeletedRecordsView } from "@/components/dashboard/deleted-records-view";

export default async function DealsPage({
    searchParams,
}: {
    searchParams: Promise<{
        query?: string;
        after?: string;
    }>;
}) {
    const { query = "", after } = await searchParams;

    try {
        const response = await getDeals(100, after, query);
        const deals = response.results.map((deal: any) => ({
            ...deal,
            createdAt: deal.properties.createdate ? new Date(deal.properties.createdate).toLocaleDateString() : "-"
        }));
        const nextCursor = response.paging?.next?.after;

        const columns = [
            { header: "Deal Name", accessorKey: "dealname" },
            { header: "Amount", accessorKey: "amount" },
            { header: "Stage", accessorKey: "dealstage" },
            { header: "Pipeline", accessorKey: "pipeline" },
            { header: "Created At", accessorKey: "createdAt" },
        ];

        return (
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Deals</h2>
                </div>
                <div className="flex items-center space-x-2">
                    <Search placeholder="Search deals..." />
                    <RefreshObjectButton objectType="deals" />
                    <DeletedRecordsView objectType="deals" />
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>All Deals</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DataTable data={deals} columns={columns} />
                        <PaginationControls nextCursor={nextCursor} />
                    </CardContent>
                </Card>
            </div>
        );
    } catch (error: any) {
        return <div className="p-8 text-red-500">Error: {error.message}</div>;
    }
}
