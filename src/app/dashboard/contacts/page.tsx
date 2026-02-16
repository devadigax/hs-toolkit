import { Suspense } from "react";
import { getContacts } from "@/lib/actions";
import { ContactsTable } from "@/components/dashboard/contacts-table";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Search } from "@/components/ui/search";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshObjectButton } from "@/components/dashboard/refresh-object-button";

export default async function ContactsPage({
    searchParams,
}: {
    searchParams: Promise<{
        query?: string;
        after?: string;
    }>;
}) {
    const { query = "", after } = await searchParams;

    try {
        const response = await getContacts(100, after, query);
        const contacts = response.results;
        const nextCursor = response.paging?.next?.after;

        return (
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Contacts</h2>
                </div>
                <div className="flex items-center space-x-2">
                    <Search placeholder="Search contacts..." />
                    <RefreshObjectButton objectType="contacts" />
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>All Contacts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ContactsTable data={contacts} />
                        <PaginationControls nextCursor={nextCursor} />
                    </CardContent>
                </Card>
            </div>
        );
    } catch (error: any) {
        if (error.message.includes("No value for refresh token found")) {
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
                Error loading contacts: {error.message}
            </div>
        )
    }
}
