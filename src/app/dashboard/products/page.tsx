import { getProducts, getSchemaProperties } from "@/lib/actions";
import { DataTable } from "@/components/ui/data-table";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Card, CardContent } from "@/components/ui/card";
import { Search } from "@/components/ui/search";
import { InactiveToggle } from "@/components/dashboard/inactive-toggle";
import { RefreshObjectButton } from "@/components/dashboard/refresh-object-button";
import { DeletedRecordsView } from "@/components/dashboard/deleted-records-view";
import { SchemaLinkButton } from "@/components/dashboard/schema-link-button";
import { formatDateForDisplay, getErrorMessage } from "@/lib/utils";
import { buildSchemaIndexColumns, getRequestedSchemaProperties, getSchemaPropertyNames, parseSelectedColumns } from "@/lib/object-index-columns";
import type { HubSpotObject } from "@/types/hubspot";

export default async function ProductsPage({
    searchParams,
}: {
    searchParams: Promise<{
        after?: string;
        query?: string;
        showInactive?: string;
        searchField?: string;
        columns?: string;
    }>;
}) {
    const { after, query, showInactive, searchField, columns: columnParam } = await searchParams;
    const showInactiveBool = showInactive === 'true';
    const selectedColumnKeys = parseSelectedColumns(columnParam);
    const defaultVisibleColumns = ["name", "hs_sku", "price", "hs_status", "createdAt"];

    try {
        const [schemaProperties, response] = await Promise.all([
            getSchemaProperties("products"),
            getProducts(100, after, query, showInactiveBool, searchField, getRequestedSchemaProperties(selectedColumnKeys))
        ]);
        const products = response.results.map((product) => {
            const record = product as HubSpotObject;
            return {
                ...record,
                name: record.properties.name ?? record.id,
                hs_sku: record.properties.hs_sku ?? "",
                description: record.properties.description ?? "",
                price: record.properties.price ?? "",
                hs_status: record.properties.hs_status ?? "",
                hs_folder_id: record.properties.hs_folder_id ?? "-",
                createdAt: formatDateForDisplay(record.properties.createdate),
                lastModifiedAt: formatDateForDisplay(record.properties.lastmodifieddate),
                source: record.properties.hs_object_source ?? "-"
            };
        });
        const nextCursor = response.paging?.next?.after;

        const columns = buildSchemaIndexColumns({
            schemaProperties,
            leadingColumns: [
                { header: "Product Name", accessorKey: "name", alwaysVisible: true, width: 260 },
            ],
            trailingColumns: [
                { header: "Created At", accessorKey: "createdAt" },
                { header: "Last Modified", accessorKey: "lastModifiedAt", hiddenByDefault: true },
                { header: "Source", accessorKey: "source", hiddenByDefault: true },
            ],
            defaultVisible: defaultVisibleColumns,
        });

        return (
            <div className="flex-1 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-3xl font-bold tracking-tight">Products</h2>
                    <div className="flex flex-wrap items-center gap-2">
                        <Search placeholder="Search products..." properties={getSchemaPropertyNames(schemaProperties)} />
                        <InactiveToggle />
                        <SchemaLinkButton objectType="products" />
                        <RefreshObjectButton objectType="products" />
                        <DeletedRecordsView objectType="products" />
                    </div>
                </div>
                <Card>
                    <CardContent className="pt-6">
                        <DataTable
                            title="All Products"
                            data={products}
                            columns={columns}
                            clickableColumn="name"
                            syncColumnVisibility
                            selectedColumnKeys={selectedColumnKeys}
                        />
                        <PaginationControls nextCursor={nextCursor} />
                    </CardContent>
                </Card>
            </div>
        );
    } catch (error: unknown) {
        return <div className="p-8 text-red-500">Error: {getErrorMessage(error)}</div>;
    }
}
