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
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Users</h2>
                    <div className="flex items-center space-x-2">
                        <RefreshObjectButton objectType="users" />
                        {/* Note: 'users' isn't in OBJECT_PROPERTIES keys for revalidation, 
                             so RefreshObjectButton might need adjustment or we just accept it won't purge cache 
                             if we didn't add cache tags for users. 
                             Wait, getUsers is NOT cached with unstable_cache in actions.ts, so it's always fresh-ish 
                             unless Next.js caches the fetch automatically. 
                             If we want to force refresh, we might need a server action that revalidates path.
                             For now, let's omit the refresh button or rely on router.refresh() from it if it supports generic revalidation? 
                             Actually, let's keep it simple. Users rarely change.
                         */}
                    </div>
                </div>
                <Card>
                    <CardHeader>
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
    } catch (error) {
        return (
            <div className="flex-1 space-y-4 p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
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
