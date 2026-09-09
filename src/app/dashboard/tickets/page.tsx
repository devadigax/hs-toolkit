import { getTickets, getSchemaProperties } from "@/lib/actions";
import { DataTable } from "@/components/ui/data-table";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Search } from "@/components/ui/search";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshObjectButton } from "@/components/dashboard/refresh-object-button";
import { DeletedRecordsView } from "@/components/dashboard/deleted-records-view";
import { CreateRecordDialog } from "@/components/dashboard/create-record-dialog";
import { SchemaLinkButton } from "@/components/dashboard/schema-link-button";
import { formatDateForDisplay, getErrorMessage } from "@/lib/utils";
import { buildSchemaIndexColumns, getRequestedSchemaProperties, getSchemaPropertyNames, parseSelectedColumns } from "@/lib/object-index-columns";
import type { HubSpotObject } from "@/types/hubspot";

export default async function TicketsPage({
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
    const defaultVisibleColumns = ["subject", "hs_pipeline_stage", "createdAt"];

    try {
        const [schemaProperties, response] = await Promise.all([
            getSchemaProperties("tickets"),
            getTickets(100, after, query, searchField, getRequestedSchemaProperties(selectedColumnKeys))
        ]);
        const tickets = response.results.map((ticket) => {
            const record = ticket as HubSpotObject;
            return {
                ...record,
                subject: record.properties.subject ?? record.id,
                content: record.properties.content ?? "",
                hs_pipeline: record.properties.hs_pipeline ?? "",
                hs_pipeline_stage: record.properties.hs_pipeline_stage ?? "",
                hs_ticket_priority: record.properties.hs_ticket_priority ?? "",
                hs_ticket_category: record.properties.hs_ticket_category ?? "",
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
                { header: "Ticket Name", accessorKey: "subject", alwaysVisible: true, width: 260 },
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
                    <h2 className="text-3xl font-bold tracking-tight">Tickets</h2>
                    <div className="flex flex-wrap items-center gap-2">
                        <Search placeholder="Search tickets..." properties={schemaPropertyNames} />
                        <CreateRecordDialog type="tickets" properties={schemaPropertyNames} objectLabel="ticket" />
                        <SchemaLinkButton objectType="tickets" />
                        <RefreshObjectButton objectType="tickets" />
                        <DeletedRecordsView objectType="tickets" />
                    </div>
                </div>
                <Card>
                    <CardContent className="pt-6">
                        <DataTable
                            title="All Tickets"
                            data={tickets}
                            columns={columns}
                            clickableColumn="subject"
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
