import { getDeals, getSchemaProperties } from "@/lib/actions";
import { DataTable } from "@/components/ui/data-table";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Search } from "@/components/ui/search";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshObjectButton } from "@/components/dashboard/refresh-object-button";
import { DeletedRecordsView } from "@/components/dashboard/deleted-records-view";
import { CreateRecordDialog } from "@/components/dashboard/create-record-dialog";
import { formatDateForDisplay, getErrorMessage } from "@/lib/utils";
import { buildSchemaIndexColumns, getRequestedSchemaProperties, getSchemaPropertyNames, parseSelectedColumns } from "@/lib/object-index-columns";
import type { HubSpotObject } from "@/types/hubspot";

export default async function DealsPage({
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
    const defaultVisibleColumns = ["dealname", "amount", "dealstage", "createdAt"];
    const defaultProperties = ["dealname", "amount", "dealstage", "createdate"];

    try {
        const [schemaProperties, response] = await Promise.all([
            getSchemaProperties("deals"),
            getDeals(100, after, query, searchField, getRequestedSchemaProperties(selectedColumnKeys, defaultProperties))
        ]);
        const deals = response.results.map((deal) => {
            const record = deal as HubSpotObject;
            return {
                ...record,
                dealname: record.properties.dealname ?? record.id,
                amount: record.properties.amount ?? "",
                dealstage: record.properties.dealstage ?? "",
                pipeline: record.properties.pipeline ?? "",
                dealtype: record.properties.dealtype ?? "",
                closeDate: formatDateForDisplay(record.properties.closedate),
                createdAt: formatDateForDisplay(record.properties.createdate),
                lastModifiedAt: formatDateForDisplay(record.properties.lastmodifieddate),
                source: record.properties.hs_object_source ?? "-"
            };
        });
        const nextCursor = response.paging?.next?.after;

        const columns = buildSchemaIndexColumns({
            schemaProperties,
            leadingColumns: [],
            trailingColumns: [
                { header: "Close Date", accessorKey: "closeDate", hiddenByDefault: true },
                { header: "Created At", accessorKey: "createdAt" },
                { header: "Last Modified", accessorKey: "lastModifiedAt", hiddenByDefault: true },
                { header: "Source", accessorKey: "source", hiddenByDefault: true },
            ],
            defaultVisible: defaultVisibleColumns,
        });

        return (
            <div className="flex-1 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-3xl font-bold tracking-tight">Deals</h2>
                    <div className="flex flex-wrap items-center gap-2">
                    <Search placeholder="Search deals..." properties={getSchemaPropertyNames(schemaProperties)} />
                    <CreateRecordDialog type="deals" />
                    <RefreshObjectButton objectType="deals" />
                    <DeletedRecordsView objectType="deals" />
                </div>
                </div>
                <Card>
                    <CardContent className="pt-6">
                        <DataTable
                            title="All Deals"
                            data={deals}
                            columns={columns}
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
