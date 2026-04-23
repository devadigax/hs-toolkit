import { getLineItems, getAllProperties } from "@/lib/actions";
import { DataTable } from "@/components/ui/data-table";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Search } from "@/components/ui/search";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshObjectButton } from "@/components/dashboard/refresh-object-button";
import { DeletedRecordsView } from "@/components/dashboard/deleted-records-view";
import { formatDateForDisplay, getErrorMessage } from "@/lib/utils";
import type { HubSpotAssociationCollection, HubSpotObject } from "@/types/hubspot";

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
        const lineItems = response.results.map((item) => {
            const record = item as HubSpotObject;
            const associations = record.associations || {};
            const associationSummary = Object.entries(associations)
                .map(([type, group]: [string, HubSpotAssociationCollection]) => {
                    const count = group.results?.length || 0;
                    if (count === 0) return null;
                    // Format type name (e.g. "line_items" -> "Line Items")
                    const typeName = type.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
                    return `${typeName} (${count})`;
                })
                .filter(Boolean)
                .join(", ");

            return {
                ...record,
                associationsSummary: associationSummary || "None",
                name: record.properties.name || record.id,
                hs_sku: record.properties.hs_sku || "",
                description: record.properties.description || "",
                price: record.properties.price || "",
                quantity: record.properties.quantity || "",
                amount: record.properties.amount || "",
                discount: record.properties.discount || "",
                createdAt: formatDateForDisplay(record.properties.createdate),
                lastModifiedAt: formatDateForDisplay(record.properties.lastmodifieddate),
                source: record.properties.hs_object_source || "-"
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
            <div className="flex-1 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-3xl font-bold tracking-tight">Line Items</h2>
                    <div className="flex items-center space-x-2">
                    <Search placeholder="Search line items..." properties={allProperties} />
                    <RefreshObjectButton objectType="line-items" />
                    <DeletedRecordsView objectType="line-items" />
                </div>
                </div>
                <Card>
                    <CardContent className="pt-6">
                        <DataTable title="All Line Items" data={lineItems} columns={columns} />
                        <PaginationControls nextCursor={nextCursor} />
                    </CardContent>
                </Card>
            </div>
        );
    } catch (error: unknown) {
        return <div className="p-8 text-red-500">Error: {getErrorMessage(error)}</div>;
    }
}
