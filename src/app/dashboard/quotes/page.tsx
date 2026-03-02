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
            hs_title: quote.properties.hs_title || quote.id,
            hs_expiration_date: quote.properties.hs_expiration_date ? new Date(quote.properties.hs_expiration_date).toLocaleDateString() : "-",
            hs_status: quote.properties.hs_status || "",
            hs_quote_amount: quote.properties.hs_quote_amount || "",
            createdAt: quote.properties.createdate ? new Date(quote.properties.createdate).toLocaleDateString() : "-",
            lastModifiedAt: quote.properties.lastmodifieddate ? new Date(quote.properties.lastmodifieddate).toLocaleDateString() : "-",
            source: quote.properties.hs_object_source || "-"
        }));
        const nextCursor = response.paging?.next?.after;

        const columns = [
            { header: "Title", accessorKey: "hs_title" },
            { header: "Amount", accessorKey: "hs_quote_amount" },
            { header: "Status", accessorKey: "hs_status" },
            { header: "Expiration Date", accessorKey: "hs_expiration_date", hiddenByDefault: true },
            { header: "Created At", accessorKey: "createdAt" },
            { header: "Last Modified", accessorKey: "lastModifiedAt", hiddenByDefault: true },
            { header: "Source", accessorKey: "source", hiddenByDefault: true },
        ];

        return (
            <div className="flex-1 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-3xl font-bold tracking-tight">Quotes</h2>
                    <div className="flex items-center space-x-2">
                    <Search placeholder="Search quotes..." properties={allProperties} />
                    <RefreshObjectButton objectType="quotes" />
                    <DeletedRecordsView objectType="quotes" />
                </div>
                </div>
                <Card>
                    <CardContent className="pt-6">
                        <DataTable title="All Quotes" data={quotes} columns={columns} />
                        <PaginationControls nextCursor={nextCursor} />
                    </CardContent>
                </Card>
            </div>
        );
    } catch (error: any) {
        return <div className="p-8 text-red-500">Error: {error.message}</div>;
    }
}
