"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface AssociationsListProps {
    associations: Record<string, any[]>;
    currentType: string;
}

export function AssociationsList({ associations, currentType }: AssociationsListProps) {
    if (!associations || Object.keys(associations).length === 0) {
        return null;
    }

    // Helper to format type name (e.g., "line_items" -> "Line Items")
    const formatType = (type: string) => {
        return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    };

    // Helper to get the correct URL path for an object type
    const getPathType = (assocType: string) => {
        // Map simplified type names if needed, or use as is
        // e.g., "companies" -> "companies"
        // "line_items" -> "line-items"
        if (assocType === "line_items" || assocType === "line items") return "line-items";
        return assocType.replace(/ /g, "-");
    };

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Associations</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {Object.entries(associations).map(([type, items]) => {
                        // items is a CollectionResponseSimplePublicObjectId, so items.results is the array
                        const rawResults = (items as any).results || [];
                        if (rawResults.length === 0) return null;

                        // Deduplicate results by id
                        const uniqueResults = Array.from(new Map(rawResults.map((item: any) => [item.id, item])).values());

                        return (
                            <div key={type} className="space-y-2">
                                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                                    {formatType(type)} ({uniqueResults.length})
                                </h3>
                                <div className="flex flex-col space-y-2">
                                    {uniqueResults.map((item: any) => {
                                        const name = item.name ||
                                            item.dealname ||
                                            item.subject ||
                                            item.hs_title ||
                                            item.hs_meeting_title ||
                                            item.hs_task_subject ||
                                            item.hs_body_preview ||
                                            (item.firstname ? `${item.firstname} ${item.lastname || ''}` : null) ||
                                            item.email ||
                                            `ID: ${item.id}`;

                                        return (
                                            <Button
                                                key={item.id}
                                                variant="outline"
                                                size="sm"
                                                className="justify-between"
                                                asChild
                                            >
                                                <Link href={`/dashboard/${getPathType(type)}/${item.id}`}>
                                                    <span className="truncate mr-2" title={name}>{name}</span>
                                                    <ExternalLink className="h-3 w-3 ml-2 opacity-50 shrink-0" />
                                                </Link>
                                            </Button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
