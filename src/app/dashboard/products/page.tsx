import { getProducts, getAllProperties } from "@/lib/actions";
import { DataTable } from "@/components/ui/data-table";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search } from "@/components/ui/search";
import { InactiveToggle } from "@/components/dashboard/inactive-toggle";
import { RefreshObjectButton } from "@/components/dashboard/refresh-object-button";
import { DeletedRecordsView } from "@/components/dashboard/deleted-records-view";

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
        const products = response.results.map((product: any) => ({
            ...product,
            createdAt: product.properties.createdate ? new Date(product.properties.createdate).toLocaleDateString() : "-"
        }));
        const nextCursor = response.paging?.next?.after;

        const columns = [
            { header: "Name", accessorKey: "name" },
            { header: "SKU", accessorKey: "hs_sku" },
            { header: "Description", accessorKey: "description" },
            { header: "Price", accessorKey: "price" },
            { header: "Status", accessorKey: "hs_status" },
            { header: "Created At", accessorKey: "createdAt" },
        ];

        return (
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Products</h2>
                </div>
                <div className="flex items-center justify-between space-x-4">
                    <Search placeholder="Search products..." properties={allProperties} />
                    <div className="flex items-center space-x-2">
                        <InactiveToggle />
                        <RefreshObjectButton objectType="products" />
                        <DeletedRecordsView objectType="products" />
                    </div>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>All Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DataTable data={products} columns={columns} />
                        <PaginationControls nextCursor={nextCursor} />
                    </CardContent>
                </Card>
            </div>
        );
    } catch (error: any) {
        return <div className="p-8 text-red-500">Error: {error.message}</div>;
    }
}
