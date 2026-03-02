import { getDeals, getAllProperties } from "@/lib/actions";
import { DataTable } from "@/components/ui/data-table";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Search } from "@/components/ui/search";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshObjectButton } from "@/components/dashboard/refresh-object-button";
import { DeletedRecordsView } from "@/components/dashboard/deleted-records-view";
import { CreateRecordDialog } from "@/components/dashboard/create-record-dialog";

export default async function DealsPage({
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
            getDeals(100, after, query, searchField),
            getAllProperties("deals")
        ]);
        const deals = response.results.map((deal: any) => ({
            ...deal,
            dealname: deal.properties.dealname || deal.id,
            amount: deal.properties.amount || "",
            dealstage: deal.properties.dealstage || "",
            pipeline: deal.properties.pipeline || "",
            dealtype: deal.properties.dealtype || "",
            closeDate: deal.properties.closedate ? new Date(deal.properties.closedate).toLocaleDateString() : "-",
            createdAt: deal.properties.createdate ? new Date(deal.properties.createdate).toLocaleDateString() : "-",
            lastModifiedAt: deal.properties.lastmodifieddate ? new Date(deal.properties.lastmodifieddate).toLocaleDateString() : "-",
            source: deal.properties.hs_object_source || "-"
        }));
        const nextCursor = response.paging?.next?.after;

        const columns = [
            { header: "Deal Name", accessorKey: "dealname" },
            { header: "Amount", accessorKey: "amount" },
            { header: "Stage", accessorKey: "dealstage" },
            { header: "Type", accessorKey: "dealtype", hiddenByDefault: true },
            { header: "Pipeline", accessorKey: "pipeline", hiddenByDefault: true },
            { header: "Close Date", accessorKey: "closeDate", hiddenByDefault: true },
            { header: "Created At", accessorKey: "createdAt" },
            { header: "Last Modified", accessorKey: "lastModifiedAt", hiddenByDefault: true },
            { header: "Source", accessorKey: "source", hiddenByDefault: true },
        ];

        return (
            <div className="flex-1 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-3xl font-bold tracking-tight">Deals</h2>
                    <div className="flex items-center space-x-2">
                    <Search placeholder="Search deals..." properties={allProperties} />
                    <CreateRecordDialog type="deals" />
                    <RefreshObjectButton objectType="deals" />
                    <DeletedRecordsView objectType="deals" />
                </div>
                </div>
                <Card>
                    <CardContent className="pt-6">
                        <DataTable title="All Deals" data={deals} columns={columns} />
                        <PaginationControls nextCursor={nextCursor} />
                    </CardContent>
                </Card>
            </div>
        );
    } catch (error: any) {
        return <div className="p-8 text-red-500">Error: {error.message}</div>;
    }
}
