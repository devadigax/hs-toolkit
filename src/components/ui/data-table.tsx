"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Column {
    header: string;
    accessorKey: string;
    hiddenByDefault?: boolean;
    cell?: (row: TableRowData) => React.ReactNode;
}

export interface TableRowData {
    id?: string;
    properties?: Record<string, string | number | boolean | null | undefined>;
    [key: string]: unknown;
}

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

export function DataTable({ data, columns, clickableColumn, title }: { data: TableRowData[]; columns: Column[]; clickableColumn?: string, title?: string }) {
    const pathname = usePathname();
    const linkColumn = clickableColumn || columns[0]?.accessorKey;
    const renderValue = (value: unknown) => {
        if (
            value === null ||
            value === undefined ||
            typeof value === "string" ||
            typeof value === "number" ||
            typeof value === "boolean"
        ) {
            return value as React.ReactNode;
        }

        return JSON.stringify(value);
    };

    // Initialize visible columns based on hiddenByDefault
    const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(() => {
        const initialVisibility: Record<string, boolean> = {};
        columns.forEach(col => {
            initialVisibility[col.accessorKey] = !col.hiddenByDefault;
        });
        return initialVisibility;
    });

    const activeColumns = columns.filter(col => visibleColumns[col.accessorKey]);

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div>
                    {title && <h3 className="text-lg font-semibold">{title}</h3>}
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-auto">
                            Columns <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {columns.map((column) => {
                            return (
                                <DropdownMenuCheckboxItem
                                    key={column.accessorKey}
                                    className="capitalize"
                                    checked={visibleColumns[column.accessorKey]}
                                    onCheckedChange={(value) =>
                                        setVisibleColumns((prev) => ({
                                            ...prev,
                                            [column.accessorKey]: !!value,
                                        }))
                                    }
                                >
                                    {column.header}
                                </DropdownMenuCheckboxItem>
                            )
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            {activeColumns.map((col) => (
                                <TableHead key={col.accessorKey}>{col.header}</TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={activeColumns.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        ) : (
                            data.map((row, i) => (
                                <TableRow key={row.id || i}>
                                    {activeColumns.map((col) => {
                                        const value = row.properties?.[col.accessorKey] || row[col.accessorKey];
                                        return (
                                            <TableCell key={col.accessorKey}>
                                                {col.cell ? col.cell(row) : (
                                                    col.accessorKey === linkColumn ? (
                                                        <Link
                                                            href={`${pathname}/${row.id}`}
                                                            className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                                                        >
                                                            {renderValue(value) || row.id}
                                                        </Link>
                                                    ) : (
                                                        renderValue(value)
                                                    )
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
        </div>
    );
}
