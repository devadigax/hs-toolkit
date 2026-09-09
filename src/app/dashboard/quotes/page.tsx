import { getQuotes, getSchemaProperties } from "@/lib/actions";
import { DataTable } from "@/components/ui/data-table";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Search } from "@/components/ui/search";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshObjectButton } from "@/components/dashboard/refresh-object-button";
import { DeletedRecordsView } from "@/components/dashboard/deleted-records-view";
import { SchemaLinkButton } from "@/components/dashboard/schema-link-button";
import { formatDateForDisplay, getErrorMessage } from "@/lib/utils";
import { buildSchemaIndexColumns, getRequestedSchemaProperties, getSchemaPropertyNames, parseSelectedColumns } from "@/lib/object-index-columns";
import type { HubSpotObject } from "@/types/hubspot";

export default async function QuotesPage({
    searchParams,
}: {
    searchParams: Promise<{
        query?: string;
        after?: string;
        searchField?: string;
        columns?: string;
    }>;
}) {
    const { query = "", after, searchField, columns: columnParam } = await searchParams;
    const selectedColumnKeys = parseSelectedColumns(columnParam);
    const defaultVisibleColumns = ["hs_title", "hs_quote_amount", "hs_status", "createdAt"];

    try {
        const [schemaProperties, response] = await Promise.all([
            getSchemaProperties("quotes"),
            getQuotes(100, after, query, searchField, getRequestedSchemaProperties(selectedColumnKeys))
        ]);
        const quotes = response.results.map((quote) => {
            const record = quote as HubSpotObject;
            return {
                ...record,
                hs_title: record.properties.hs_title ?? record.id,
                hs_expiration_date: formatDateForDisplay(record.properties.hs_expiration_date),
                hs_status: record.properties.hs_status ?? "",
                hs_quote_amount: record.properties.hs_quote_amount ?? "",
                createdAt: formatDateForDisplay(record.properties.createdate),
                lastModifiedAt: formatDateForDisplay(record.properties.lastmodifieddate),
                source: record.properties.hs_object_source ?? "-"
            };
        });
        const nextCursor = response.paging?.next?.after;

        const schemaPropertyNames = getSchemaPropertyNames(schemaProperties);
        const columns = buildSchemaIndexColumns({
            schemaProperties,
            leadingColumns: [
                { header: "Quote Title", accessorKey: "hs_title", alwaysVisible: true, width: 260 },
            ],
            trailingColumns: [
                { header: "Expiration Date", accessorKey: "hs_expiration_date", hiddenByDefault: true },
                { header: "Created At", accessorKey: "createdAt" },
                { header: "Last Modified", accessorKey: "lastModifiedAt", hiddenByDefault: true },
                { header: "Source", accessorKey: "source", hiddenByDefault: true },
            ],
            defaultVisible: defaultVisibleColumns,
        });

        return (
            <div className="flex-1 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-3xl font-bold tracking-tight">Quotes</h2>
                    <div className="flex flex-wrap items-center gap-2">
                        <Search placeholder="Search quotes..." properties={schemaPropertyNames} />
                        <SchemaLinkButton objectType="quotes" />
                        <RefreshObjectButton objectType="quotes" />
                        <DeletedRecordsView objectType="quotes" />
                    </div>
                </div>
                <Card>
                    <CardContent className="pt-6">
                        <DataTable
                            title="All Quotes"
                            data={quotes}
                            columns={columns}
                            clickableColumn="hs_title"
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
