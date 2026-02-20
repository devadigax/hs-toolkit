import { getQuotes, getAllProperties } from "@/lib/actions";
import { DataTable } from "@/components/ui/data-table";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Search } from "@/components/ui/search";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshObjectButton } from "@/components/dashboard/refresh-object-button";
import { DeletedRecordsView } from "@/components/dashboard/deleted-records-view";

export default async function QuotesPage({
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
            getQuotes(100, after, query, searchField),
            getAllProperties("quotes")
        ]);
        // Quotes API response structure might differ slightly, checking generic basicApi response
        // Assuming results exists
        const quotes = response.results.map((quote: any) => ({
            ...quote,
            createdAt: quote.properties.createdate ? new Date(quote.properties.createdate).toLocaleDateString() : "-"
        }));
        const nextCursor = response.paging?.next?.after;

        const columns = [
            { header: "Title", accessorKey: "hs_title" },
            { header: "Expiration Date", accessorKey: "hs_expiration_date" },
            { header: "Created At", accessorKey: "createdAt" },
        ];

        return (
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Quotes</h2>
                </div>
                <div className="flex items-center space-x-2">
                    <Search placeholder="Search quotes..." properties={allProperties} />
                    <RefreshObjectButton objectType="quotes" />
                    <DeletedRecordsView objectType="quotes" />
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>All Quotes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DataTable data={quotes} columns={columns} />
                        <PaginationControls nextCursor={nextCursor} />
                    </CardContent>
                </Card>
            </div>
        );
    } catch (error: any) {
        return <div className="p-8 text-red-500">Error: {error.message}</div>;
    }
}
