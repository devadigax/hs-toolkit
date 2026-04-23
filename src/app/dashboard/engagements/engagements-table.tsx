"use client";

import { DataTable } from "@/components/ui/data-table";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import type { TableRowData } from "@/components/ui/data-table";
import type { VariantProps } from "class-variance-authority";
import type { badgeVariants } from "@/components/ui/badge";

const formatType = (type: string) => {
    return type ? type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) : "Unknown";
};

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

const getTypeColor = (type: string): BadgeVariant => {
    switch (type) {
        case "EMAIL": return "default"; // dark
        case "CALL": return "secondary"; // gray
        case "MEETING": return "secondary"; // gray
        case "TASK": return "outline"; // white/border
        case "NOTE": return "outline";
        default: return "secondary";
    }
};

const columns = [
    {
        header: "Activity Type",
        accessorKey: "activityType",
        cell: (row: TableRowData) => (
            <Badge variant={getTypeColor(String(row.properties?.hs_engagement_type ?? ""))}>
                {formatType(String(row.properties?.hs_engagement_type ?? ""))}
            </Badge>
        )
    },
    { header: "Date", accessorKey: "formattedDate" },
    {
        header: "Subject / Body",
        accessorKey: "subject",
        cell: (row: TableRowData) => (
            <Link href={`/dashboard/engagements/${row.id}`} className="hover:underline font-medium text-blue-600 dark:text-blue-400">
                {String(row.subject ?? "")}
            </Link>
        )
    },
    { header: "Task Status", accessorKey: "hs_task_status", hiddenByDefault: true },
    { header: "Last Modified", accessorKey: "lastModifiedAt", hiddenByDefault: true },
    { header: "Source", accessorKey: "source", hiddenByDefault: true }
];

export function EngagementsTable({ data, nextCursor }: { data: TableRowData[], nextCursor?: string }) {
    return (
        <>
            <DataTable data={data} columns={columns} />
            <PaginationControls nextCursor={nextCursor} />
        </>
    );
}
