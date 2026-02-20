import { Suspense } from "react";
import { getEngagements, getAllProperties } from "@/lib/actions";
import { EngagementsTable } from "@/components/dashboard/engagements-table";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Search } from "@/components/ui/search";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function EngagementsPage({
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
            getEngagements(100, after, query, searchField),
            getAllProperties("engagements")
        ]);
        const engagements = response.results;
        const nextCursor = response.paging?.next?.after;

        return (
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Engagements</h2>
                </div>
                <div className="flex items-center space-x-2">
                    <Search placeholder="Search activity..." properties={allProperties} />
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <EngagementsTable data={engagements} />
                        <PaginationControls nextCursor={nextCursor} />
                    </CardContent>
                </Card>
            </div>
        );
    } catch (error: any) {
        if (error.message && error.message.includes("No value for refresh token found")) {
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
                Error loading engagements: {error.message || "Unknown error"}
            </div>
        )
    }
}
