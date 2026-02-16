import { getQuotes } from "@/lib/actions";
import { DataTable } from "@/components/ui/data-table";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshObjectButton } from "@/components/dashboard/refresh-object-button";

export default async function QuotesPage({
    searchParams,
}: {
    searchParams: Promise<{
        after?: string;
    }>;
}) {
    const { after } = await searchParams;

    try {
        const response = await getQuotes(100, after);
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
                    <RefreshObjectButton objectType="quotes" />
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
