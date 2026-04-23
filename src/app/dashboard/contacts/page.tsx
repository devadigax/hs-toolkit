import { getContacts, getAllProperties } from "@/lib/actions";
import { DataTable } from "@/components/ui/data-table";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Search } from "@/components/ui/search";
import { Card, CardContent } from "@/components/ui/card";
import { RefreshObjectButton } from "@/components/dashboard/refresh-object-button";
import { DeletedRecordsView } from "@/components/dashboard/deleted-records-view";
import { CreateRecordDialog } from "@/components/dashboard/create-record-dialog";
import { formatDateForDisplay, getErrorMessage } from "@/lib/utils";
import type { HubSpotObject } from "@/types/hubspot";

export default async function ContactsPage({
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
            getContacts(100, after, query, searchField),
            getAllProperties("contacts")
        ]);

        const contacts = response.results.map((contact) => {
            const record = contact as HubSpotObject;
            const firstName = record.properties.firstname || "";
            const lastName = record.properties.lastname || "";
            return {
                ...record,
                fullName: `${firstName} ${lastName}`.trim() || record.id,
                email: record.properties.email || "",
                phone: record.properties.phone || "",
                company: record.properties.company || "",
                country: record.properties.country || "",
                jobtitle: record.properties.jobtitle || "",
                lifecyclestage: record.properties.lifecyclestage || "",
                industry: record.properties.industry || "",
                website: record.properties.website || "",
                createdAt: formatDateForDisplay(record.properties.createdate),
                lastModifiedAt: formatDateForDisplay(record.properties.lastmodifieddate),
                source: record.properties.hs_object_source || "-"
            };
        });

        const nextCursor = response.paging?.next?.after;

        const columns = [
            { header: "Name", accessorKey: "fullName" },
            { header: "Email", accessorKey: "email" },
            { header: "Phone", accessorKey: "phone" },
            { header: "Job Title", accessorKey: "jobtitle", hiddenByDefault: true },
            { header: "Company", accessorKey: "company" },
            { header: "Industry", accessorKey: "industry", hiddenByDefault: true },
            { header: "Website", accessorKey: "website", hiddenByDefault: true },
            { header: "Country", accessorKey: "country", hiddenByDefault: true },
            { header: "Lifecycle Stage", accessorKey: "lifecyclestage", hiddenByDefault: true },
            { header: "Created At", accessorKey: "createdAt" },
            { header: "Last Modified", accessorKey: "lastModifiedAt", hiddenByDefault: true },
            { header: "Source", accessorKey: "source", hiddenByDefault: true },
        ];

        return (
            <div className="flex-1 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-3xl font-bold tracking-tight">Contacts</h2>
                    <div className="flex items-center space-x-2">
                    <Search placeholder="Search contacts..." properties={allProperties} />
                    <CreateRecordDialog type="contacts" />
                    <RefreshObjectButton objectType="contacts" />
                    <DeletedRecordsView objectType="contacts" />
                </div>
                </div>
                <Card>
                    <CardContent className="pt-6">
                        <DataTable title="All Contacts" data={contacts} columns={columns} clickableColumn="fullName" />
                        <PaginationControls nextCursor={nextCursor} />
                    </CardContent>
                </Card>
            </div>
        );
    } catch (error: unknown) {
        const message = getErrorMessage(error);
        if (message.includes("No value for refresh token found")) {
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
                Error loading contacts: {message}
            </div>
        )
    }
}
