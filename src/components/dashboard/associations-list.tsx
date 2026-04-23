"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { formatDateForDisplay } from "@/lib/utils";
import type { HubSpotAssociationCollection, HubSpotAssociationResult } from "@/types/hubspot";

interface AssociationsListProps {
    associations?: Record<string, HubSpotAssociationCollection>;
}

function getObjectName(item: HubSpotAssociationResult, type: string) {
    if (type === "contacts") return item.firstname ? `${item.firstname} ${item.lastname || ""}` : item.email;
    if (type === "companies") return item.name;
    if (type === "deals") return item.dealname || item.name;
    if (type === "tickets") return item.subject;
    if (type === "quotes") return item.hs_title;
    if (type === "engagements") return item.hs_meeting_title || item.hs_task_subject || item.hs_body_preview;
    if (type === "line_items" || type === "line items" || type === "line-items") return item.hs_name || item.name;

    // Fallback
    return item.name || item.hs_name || item.dealname || item.subject || item.hs_title || item.hs_meeting_title || item.hs_task_subject || item.hs_body_preview || item.email || `ID: ${item.id}`;
}

function AssociationCard({ item, type, pathType }: { item: HubSpotAssociationResult; type: string; pathType: string }) {
    const name = String(getObjectName(item, type) || `ID: ${item.id}`);

    const labels = item.associationTypes
        ?.map((associationType) => associationType.label)
        .filter(Boolean)
        .join(", ");

    const dateRaw = item.hs_createdate || item.createdate || item.hs_timestamp;
    const date = formatDateForDisplay(dateRaw, "");
    const by = item.hs_created_by_user_id || item.hs_created_by;

    const isLineItem = pathType === "line-items";
    const amount = typeof item.amount === "string" || typeof item.amount === "number" ? `$${Number(item.amount).toLocaleString()}` : null;
    const quantity = item.quantity;
    const discount = (typeof item.discount === "string" || typeof item.discount === "number") && Number(item.discount) > 0 ? `$${Number(item.discount).toLocaleString()}` : null;
    const price = typeof item.price === "string" || typeof item.price === "number" ? `$${Number(item.price).toLocaleString()}` : null;
    const sku = typeof item.hs_sku === "string" || typeof item.hs_sku === "number" ? String(item.hs_sku) : null;
    const quantityLabel = typeof quantity === "string" || typeof quantity === "number" ? String(quantity) : null;
    const byLabel = typeof by === "string" || typeof by === "number" ? String(by) : null;

    return (
        <Button
            variant="outline"
            size="sm"
            className="justify-between h-auto py-2 flex flex-col items-start"
            asChild
        >
            <Link href={`/dashboard/${pathType}/${item.id}`} className="w-full">
                <div className="flex w-full items-center justify-between">
                    <span className="truncate flex-1 text-left font-medium" title={name}>{name}</span>
                    <ExternalLink className="h-3 w-3 ml-2 opacity-50 shrink-0" />
                </div>

                {isLineItem && (sku || amount || price || quantity || discount) && (
                    <div className="flex flex-wrap text-[10px] text-muted-foreground gap-x-2 mt-1 w-full items-center">
                        {sku && <span className="font-mono bg-muted px-1 rounded" title="SKU">{sku}</span>}
                        {quantityLabel && <span>Qty: {quantityLabel}</span>}
                        {price && <span>Price: {price}</span>}
                        {discount && <span className="text-red-500">Disc: {discount}</span>}
                        {amount && <span className="font-medium text-foreground">Total: {amount}</span>}
                    </div>
                )}

                {(labels || date || by) && (
                    <div className="flex flex-wrap text-[10px] text-muted-foreground gap-x-2 mt-1 w-full items-center truncate">
                        {labels && <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded-sm">{labels}</span>}
                        {date && <span>Date: {date}</span>}
                        {byLabel && <span>By: {byLabel}</span>}
                    </div>
                )}
            </Link>
        </Button>
    );
}

export function AssociationsList({ associations }: AssociationsListProps) {
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
                        const rawResults = items.results || [];
                        if (rawResults.length === 0) return null;

                        // Deduplicate results by id
                        const uniqueResults = Array.from(new Map(rawResults.map((item) => [item.id, item])).values());

                        return (
                            <div key={type} className="space-y-2">
                                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">
                                    {formatType(type)} ({uniqueResults.length})
                                </h3>
                                <div className="flex flex-col space-y-2">
                                    {uniqueResults.map((item) => (
                                        <AssociationCard
                                            key={item.id}
                                            item={item}
                                            type={type}
                                            pathType={getPathType(type)}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
