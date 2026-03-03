import { Suspense } from "react";
import { getObjectsByType, getAllProperties, getCustomObjectSchemas } from "@/lib/actions";
import { DataTable } from "@/components/ui/data-table";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Search } from "@/components/ui/search";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshObjectButton } from "@/components/dashboard/refresh-object-button";
import { DeletedRecordsView } from "@/components/dashboard/deleted-records-view";
import { CreateRecordDialog } from "@/components/dashboard/create-record-dialog";

export default async function GenericObjectPage({
    params,
    searchParams,
}: {
    params: Promise<{
        type: string;
    }>;
    searchParams: Promise<{
        query?: string;
        after?: string;
        searchField?: string;
    }>;
}) {
    const { type } = await params;
    const { query = "", after, searchField } = await searchParams;

    // Standard objects usually have their own dedicated page component, 
    // but if missing, they will fall back to this generic page.

    try {
        const [response, allProperties, schemas] = await Promise.all([
            getObjectsByType(type as any, 100, after, query, undefined, searchField),
            getAllProperties(type),
            getCustomObjectSchemas()
        ]);

        const schema = schemas.find((s: any) => s.objectTypeId === type || s.fullyQualifiedName === type);
        const objectLabel = schema ? schema.labels.plural : type;
        const primaryProperty = schema?.primaryDisplayProperty;

        const objects = response.results.map((obj: any) => {
            const formatted: Record<string, any> = { id: obj.id, ...obj.properties };

            // Format dates if they exist
            if (formatted.createdate) formatted.createdAt = new Date(formatted.createdate).toLocaleDateString("en-US");
            if (formatted.hs_createdate) formatted.createdAt = new Date(formatted.hs_createdate).toLocaleDateString("en-US");
            if (formatted.lastmodifieddate) formatted.lastModifiedAt = new Date(formatted.lastmodifieddate).toLocaleDateString("en-US");
            if (formatted.hs_lastmodifieddate) formatted.lastModifiedAt = new Date(formatted.hs_lastmodifieddate).toLocaleDateString("en-US");

            // Format source
            formatted.source = formatted.hs_object_source || "-";
            return formatted;
        });

        const nextCursor = response.paging?.next?.after;

        // Build generic columns based on properties returned
        const columns = [];
        if (primaryProperty) {
            columns.push({ header: primaryProperty, accessorKey: primaryProperty });
        } else {
            columns.push({ header: "ID", accessorKey: "id" });
        }

        // Add up to 5 properties to list
        const skipProps = [primaryProperty, "hs_object_id", "createdate", "hs_createdate", "lastmodifieddate", "hs_lastmodifieddate", "hs_object_source", "hs_created_by_user_id"];
        let addedProps = 0;
        for (const prop of allProperties) {
            if (addedProps >= 5) break;
            if (!skipProps.includes(prop) && !prop.startsWith("hs_")) {
                columns.push({ header: prop, accessorKey: prop });
                addedProps++;
            }
        }

        columns.push({ header: "Created At", accessorKey: "createdAt" });
        columns.push({ header: "Last Modified", accessorKey: "lastModifiedAt", hiddenByDefault: true });
        columns.push({ header: "Source", accessorKey: "source", hiddenByDefault: true });

        return (
            <div className="flex-1 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-3xl font-bold tracking-tight capitalize">{objectLabel}</h2>
                    <div className="flex items-center space-x-2">
                        <Search placeholder={`Search ${objectLabel}...`} properties={allProperties} />
                        <CreateRecordDialog type={type} properties={allProperties} objectLabel={schema?.labels.singular || type} />
                        <RefreshObjectButton objectType={type} />
                        <DeletedRecordsView objectType={type} />
                    </div>
                </div>
                <Card>
                    <CardContent className="pt-6">
                        <DataTable title={`All ${objectLabel}`} data={objects} columns={columns} clickableColumn={primaryProperty || "id"} />
                        <PaginationControls nextCursor={nextCursor} />
                    </CardContent>
                </Card>
            </div>
        );
    } catch (error: any) {
        if (error.message?.includes("No value for refresh token found")) {
            return (
                <div className="flex flex-col items-center justify-center p-8 text-center text-red-500">
                    <p>Authentication Failed. please login again.</p>
                    <div className="mt-4">
                        <a href="/api/auth/login" className="text-blue-500 hover:underline">Login with HubSpot</a>
                    </div>
                </div>
            )
        }

        return (
            <div className="p-8 text-red-500">
                Error loading {type}: {error.message}
            </div>
        )
    }
}
