import { getProducts } from "@/lib/actions";
import { DataTable } from "@/components/ui/data-table";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search } from "@/components/ui/search";
import { InactiveToggle } from "@/components/dashboard/inactive-toggle";

export default async function ProductsPage({
    searchParams,
}: {
    searchParams: Promise<{
        after?: string;
        query?: string;
        showInactive?: string;
    }>;
}) {
    const { after, query, showInactive } = await searchParams;
    const showInactiveBool = showInactive === 'true';

    try {
        const response = await getProducts(100, after, query, showInactiveBool);
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
                    <Search placeholder="Search products..." />
                    <InactiveToggle />
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
