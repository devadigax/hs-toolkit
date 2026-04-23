import { getCompanies, getAllProperties } from "@/lib/actions";
import { DataTable } from "@/components/ui/data-table";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Search } from "@/components/ui/search";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshObjectButton } from "@/components/dashboard/refresh-object-button";
import { DeletedRecordsView } from "@/components/dashboard/deleted-records-view";
import { CreateRecordDialog } from "@/components/dashboard/create-record-dialog";
import { formatDateForDisplay, getErrorMessage } from "@/lib/utils";
import type { HubSpotObject } from "@/types/hubspot";

export default async function CompaniesPage({
    searchParams,
}: {
    searchParams: Promise<{
        query?: string;
        after?: string;
        searchField?: string;
    }>;
}) {
    const { query = "", after, searchField } = await searchParams;

    try {
        const [response, allProperties] = await Promise.all([
            getCompanies(100, after, query, searchField),
            getAllProperties("companies")
        ]);
        const companies = response.results.map((company) => {
            const record = company as HubSpotObject;
            return {
                ...record,
                name: record.properties.name || "",
                domain: record.properties.domain || "",
                industry: record.properties.industry || "",
                phone: record.properties.phone || "",
                website: record.properties.website || "",
                city: record.properties.city || "",
                state: record.properties.state || "",
                country: record.properties.country || "",
                lifecyclestage: record.properties.lifecyclestage || "",
                createdAt: formatDateForDisplay(record.properties.createdate),
                lastModifiedAt: formatDateForDisplay(record.properties.lastmodifieddate),
                source: record.properties.hs_object_source || "-"
            };
        });
        const nextCursor = response.paging?.next?.after;

        const columns = [
            { header: "Name", accessorKey: "name" },
            { header: "Domain", accessorKey: "domain" },
            { header: "Phone", accessorKey: "phone", hiddenByDefault: true },
            { header: "Website", accessorKey: "website", hiddenByDefault: true },
            { header: "Industry", accessorKey: "industry", hiddenByDefault: true },
            { header: "City", accessorKey: "city", hiddenByDefault: true },
            { header: "State", accessorKey: "state", hiddenByDefault: true },
            { header: "Country", accessorKey: "country", hiddenByDefault: true },
            { header: "Lifecycle Stage", accessorKey: "lifecyclestage", hiddenByDefault: true },
            { header: "Created At", accessorKey: "createdAt" },
            { header: "Last Modified", accessorKey: "lastModifiedAt", hiddenByDefault: true },
            { header: "Source", accessorKey: "source", hiddenByDefault: true },
        ];

        return (
            <div className="flex-1 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-3xl font-bold tracking-tight">Companies</h2>
                    <div className="flex items-center space-x-2">
                    <Search placeholder="Search companies..." properties={allProperties} />
                    <CreateRecordDialog type="companies" />
                    <RefreshObjectButton objectType="companies" />
                    <DeletedRecordsView objectType="companies" />
                </div>
                </div>
                <Card>
                    <CardContent className="pt-6">
                        <DataTable title="All Companies" data={companies} columns={columns} />
                        <PaginationControls nextCursor={nextCursor} />
                    </CardContent>
                </Card>
            </div >
        );
    } catch (error: unknown) {
        return <div className="p-8 text-red-500">Error: {getErrorMessage(error)}</div>;
    }
}
