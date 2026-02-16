"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface Engagement {
    id: string;
    properties: {
        hs_engagement_type: string;
        hs_timestamp: string;
        hs_body_preview?: string;
        hs_task_subject?: string;
        hs_meeting_title?: string;
        hs_note_body?: string;
        [key: string]: any;
    };
}

interface EngagementsTableProps {
    data: Engagement[];
}

export function EngagementsTable({ data }: EngagementsTableProps) {
    if (!data || data.length === 0) {
        return <div className="p-4 text-muted-foreground">No engagements found.</div>;
    }

    const formatType = (type: string) => {
        return type ? type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) : "Unknown";
    };

    const getSubject = (props: any) => {
        if (props.hs_task_subject) return props.hs_task_subject;
        if (props.hs_meeting_title) return props.hs_meeting_title;
        if (props.hs_note_body) return props.hs_note_body.replace(/<[^>]*>?/gm, '').substring(0, 50) + "..."; // Strip HTML for notes
        if (props.hs_body_preview) return props.hs_body_preview;
        return "No Subject";
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case "EMAIL": return "default"; // dark
            case "CALL": return "secondary"; // gray
            case "MEETING": return "secondary"; // gray
            case "TASK": return "outline"; // white/border
            case "NOTE": return "outline";
            default: return "secondary";
        }
    };

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Activity Type</TableHead>
                    <TableHead>Subject / Body</TableHead>
                    <TableHead>Date</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.map((item) => (
                    <TableRow key={item.id}>
                        <TableCell>
                            <Badge variant={getTypeColor(item.properties.hs_engagement_type) as "default" | "secondary" | "destructive" | "outline"}>
                                {formatType(item.properties.hs_engagement_type)}
                            </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                            <Link href={`/dashboard/engagements/${item.id}`} className="hover:underline">
                                {getSubject(item.properties)}
                            </Link>
                        </TableCell>
                        <TableCell>
                            {item.properties.hs_timestamp ? format(new Date(item.properties.hs_timestamp), "MMM d, yyyy h:mm a") : "-"}
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}
