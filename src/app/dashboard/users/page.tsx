import { Suspense } from "react";
import { getUsers } from "@/lib/actions";
import { UsersTable } from "@/components/dashboard/users-table";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshObjectButton } from "@/components/dashboard/refresh-object-button";

export default async function UsersPage({
    searchParams,
}: {
    searchParams: Promise<{
        after?: string;
    }>;
}) {
    const { after } = await searchParams;

    try {
        const data = await getUsers(100, after);
        const users = data.results || [];
        const nextAfter = data.paging?.next?.after;

        return (
            <div className="flex-1 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-3xl font-bold tracking-tight">Users</h2>
                    <div className="flex items-center space-x-2">
                        <RefreshObjectButton objectType="users" />
                    </div>
                </div>
                <Card>
                    <CardHeader className="pt-6 pb-2">
                        <CardTitle>All Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Suspense fallback={<UsersTableSkeleton />}>
                            <UsersTable users={users} />
                        </Suspense>

                        <div className="mt-4">
                            <PaginationControls
                                nextCursor={nextAfter}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    } catch {
        return (
            <div className="flex-1 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-3xl font-bold tracking-tight">Users</h2>
                </div>
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-red-500">
                            Error loading users. Please check your permissions or try again later.
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }
}

function UsersTableSkeleton() {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
            </div>
        </div>
    );
}
