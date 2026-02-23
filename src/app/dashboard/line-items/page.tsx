import { getLineItems, getAllProperties } from "@/lib/actions";
import { DataTable } from "@/components/ui/data-table";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Search } from "@/components/ui/search";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshObjectButton } from "@/components/dashboard/refresh-object-button";
import { DeletedRecordsView } from "@/components/dashboard/deleted-records-view";

export default async function LineItemsPage({
    searchParams,
}: {
    searchParams: Promise<{
        after?: string;
        query?: string;
        searchField?: string;
    }>;
}) {
    const { after, query, searchField } = await searchParams;

    try {
        const [response, allProperties] = await Promise.all([
            getLineItems(100, after, query, searchField),
            getAllProperties("line-items")
        ]);

        // Format associations for display
        const lineItems = response.results.map((item: any) => {
            const associations = item.associations || {};
            const associationSummary = Object.entries(associations)
                .map(([type, group]: [string, any]) => {
                    const count = group.results?.length || 0;
                    if (count === 0) return null;
                    // Format type name (e.g. "line_items" -> "Line Items")
                    const typeName = type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                    return `${typeName} (${count})`;
                })
                .filter(Boolean)
                .join(", ");

            return {
                ...item,
                associationsSummary: associationSummary || "None",
                name: item.properties.name || item.id,
                hs_sku: item.properties.hs_sku || "",
                description: item.properties.description || "",
                price: item.properties.price || "",
                quantity: item.properties.quantity || "",
                amount: item.properties.amount || "",
                discount: item.properties.discount || "",
                createdAt: item.properties.createdate ? new Date(item.properties.createdate).toLocaleDateString() : "-",
                lastModifiedAt: item.properties.lastmodifieddate ? new Date(item.properties.lastmodifieddate).toLocaleDateString() : "-",
                source: item.properties.hs_object_source || "-"
            };
        });

        const nextCursor = response.paging?.next?.after;

        const columns = [
            { header: "Name", accessorKey: "name" },
            { header: "SKU", accessorKey: "hs_sku" },
            { header: "Description", accessorKey: "description", hiddenByDefault: true },
            { header: "Price", accessorKey: "price" },
            { header: "Quantity", accessorKey: "quantity" },
            { header: "Amount", accessorKey: "amount" },
            { header: "Discount", accessorKey: "discount", hiddenByDefault: true },
            { header: "Associations", accessorKey: "associationsSummary", hiddenByDefault: true },
            { header: "Created At", accessorKey: "createdAt" },
            { header: "Last Modified", accessorKey: "lastModifiedAt", hiddenByDefault: true },
            { header: "Source", accessorKey: "source", hiddenByDefault: true },
        ];

        return (
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Line Items</h2>
                </div>
                <div className="flex items-center space-x-2">
                    <Search placeholder="Search line items..." properties={allProperties} />
                    <RefreshObjectButton objectType="line-items" />
                    <DeletedRecordsView objectType="line-items" />
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>All Line Items</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DataTable data={lineItems} columns={columns} />
                        <PaginationControls nextCursor={nextCursor} />
                    </CardContent>
                </Card>
            </div>
        );
    } catch (error: any) {
        return <div className="p-8 text-red-500">Error: {error.message}</div>;
    }
}
