"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

interface Column {
    header: string;
    accessorKey: string;
}

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

export function DataTable({ data, columns, clickableColumn }: { data: any[]; columns: Column[]; clickableColumn?: string }) {
    const pathname = usePathname();
    const linkColumn = clickableColumn || columns[0]?.accessorKey;

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        {columns.map((col) => (
                            <TableHead key={col.accessorKey}>{col.header}</TableHead>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center">
                                No results.
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((row, i) => (
                            <TableRow key={row.id || i}>
                                {columns.map((col) => {
                                    const value = row.properties?.[col.accessorKey] || row[col.accessorKey];
                                    return (
                                        <TableCell key={col.accessorKey}>
                                            {col.accessorKey === linkColumn ? (
                                                <Link
                                                    href={`${pathname}/${row.id}`}
                                                    className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                                                >
                                                    {value || row.id}
                                                </Link>
                                            ) : (
                                                value
                                            )}
                                        </TableCell>
                                    );
                                })}
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
