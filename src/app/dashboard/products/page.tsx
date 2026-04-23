import { getProducts, getAllProperties } from "@/lib/actions";
import { DataTable } from "@/components/ui/data-table";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "@/components/ui/search";
import { InactiveToggle } from "@/components/dashboard/inactive-toggle";
import { RefreshObjectButton } from "@/components/dashboard/refresh-object-button";
import { DeletedRecordsView } from "@/components/dashboard/deleted-records-view";
import { formatDateForDisplay, getErrorMessage } from "@/lib/utils";
import type { HubSpotObject } from "@/types/hubspot";

export default async function ProductsPage({
    searchParams,
}: {
    searchParams: Promise<{
        after?: string;
        query?: string;
        showInactive?: string;
        searchField?: string;
    }>;
}) {
    const { after, query, showInactive, searchField } = await searchParams;
    const showInactiveBool = showInactive === 'true';

    try {
        const [response, allProperties] = await Promise.all([
            getProducts(100, after, query, showInactiveBool, searchField),
            getAllProperties("products")
        ]);
        const products = response.results.map((product) => {
            const record = product as HubSpotObject;
            return {
                ...record,
                name: record.properties.name || record.id,
                hs_sku: record.properties.hs_sku || "",
                description: record.properties.description || "",
                price: record.properties.price || "",
                hs_status: record.properties.hs_status || "",
                hs_folder_id: record.properties.hs_folder_id || "-",
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
            { header: "Status", accessorKey: "hs_status" },
            { header: "Folder ID", accessorKey: "hs_folder_id", hiddenByDefault: true },
            { header: "Created At", accessorKey: "createdAt" },
            { header: "Last Modified", accessorKey: "lastModifiedAt", hiddenByDefault: true },
            { header: "Source", accessorKey: "source", hiddenByDefault: true },
        ];

        return (
            <div className="flex-1 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-3xl font-bold tracking-tight">Products</h2>
                    <div className="flex items-center space-x-2">
                        <Search placeholder="Search products..." properties={allProperties} />
                        <InactiveToggle />
                        <RefreshObjectButton objectType="products" />
                        <DeletedRecordsView objectType="products" />
                    </div>
                </div>
                <Card>
                    <CardContent className="pt-6">
                        <DataTable title="All Products" data={products} columns={columns} />
                        <PaginationControls nextCursor={nextCursor} />
                    </CardContent>
                </Card>
            </div>
        );
    } catch (error: unknown) {
        return <div className="p-8 text-red-500">Error: {getErrorMessage(error)}</div>;
    }
}
