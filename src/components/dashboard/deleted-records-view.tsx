"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Trash, Loader2, AlertCircle } from "lucide-react";
import { getDeletedObjectsByType } from "@/lib/actions/common";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { HubSpotObject } from "@/types/hubspot";
import { formatDateForDisplay, getErrorMessage } from "@/lib/utils";

type ArchivedHubSpotObject = HubSpotObject & {
    archivedAt?: string;
};

interface DeletedRecordsViewProps {
    objectType: string;
}

export function DeletedRecordsView({ objectType }: DeletedRecordsViewProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [data, setData] = useState<ArchivedHubSpotObject[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            startTransition(async () => {
                try {
                    setError(null);
                    // Start with high limit to see something, no pagination for V1
                    const result = await getDeletedObjectsByType(objectType as keyof typeof import("@/lib/actions/config").OBJECT_PROPERTIES, 50);
                    setData(result.results as ArchivedHubSpotObject[]);
                } catch (err: unknown) {
                    console.error(err);
                    setError(`Failed to load deleted records. ${getErrorMessage(err)}`);
                }
            });
        }
    }, [open, objectType]);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                    <Trash className="h-4 w-4" />
                    <span className="hidden sm:inline">Deleted Records</span>
                </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px]">
                <SheetHeader>
                    <SheetTitle>Deleted {objectType}</SheetTitle>
                    <SheetDescription>
                        View recently deleted (archived) records.
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-8 h-full">
                    {isPending ? (
                        <div className="flex flex-col items-center justify-center h-40 space-y-4">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Loading archived records...</p>
                        </div>
                    ) : error ? (
                        <div className="flex items-center gap-2 p-4 text-red-600 bg-red-50 rounded-md">
                            <AlertCircle className="h-5 w-5" />
                            <p className="text-sm">{error}</p>
                        </div>
                    ) : data.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            No deleted records found.
                        </div>
                    ) : (
                        <ScrollArea className="h-[calc(100vh-200px)]">
                            <div className="space-y-4 pr-4">
                                {data.map((item) => (
                                    <div key={item.id} className="flex flex-col gap-1 p-4 border rounded-lg bg-card text-card-foreground shadow-sm">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-sm">
                                                {/* Try to find a name property, fallback to ID */}
                                                {item.properties.firstname
                                                    ? `${item.properties.firstname} ${item.properties.lastname || ""}`
                                                    : item.properties.name || item.properties.dealname || item.properties.subject || item.id}
                                            </span>
                                            <span className="text-xs text-muted-foreground font-mono">{item.id}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {item.properties.hs_updated_by_user_id && (
                                                <span className="block mt-1">
                                                    Deleted by: User {item.properties.hs_updated_by_user_id}
                                                </span>
                                            )}
                                            Archived: {item.archivedAt ? formatDateForDisplay(item.archivedAt, "Unknown") : "Unknown"}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
