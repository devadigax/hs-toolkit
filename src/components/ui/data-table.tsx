"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, GripVertical, Search } from "lucide-react";

interface Column {
    header: string;
    accessorKey: string;
    hiddenByDefault?: boolean;
    cell?: (row: TableRowData) => React.ReactNode;
    width?: number;
}

export interface TableRowData {
    id?: string;
    properties?: Record<string, string | number | boolean | null | undefined>;
    [key: string]: unknown;
}

export function DataTable({
    data,
    columns,
    clickableColumn,
    title,
    syncColumnVisibility = false,
    selectedColumnKeys,
}: {
    data: TableRowData[];
    columns: Column[];
    clickableColumn?: string;
    title?: string;
    syncColumnVisibility?: boolean;
    selectedColumnKeys?: string[];
}) {
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const linkColumn = clickableColumn || columns[0]?.accessorKey;
    const [columnQuery, setColumnQuery] = useState("");
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
        const selectedSet = selectedColumnKeys ? new Set(selectedColumnKeys) : null;
        columns.forEach(col => {
            initialVisibility[col.accessorKey] = selectedSet ? selectedSet.has(col.accessorKey) : !col.hiddenByDefault;
        });
        return initialVisibility;
    });
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() => {
        const widths: Record<string, number> = {};
        columns.forEach((col, index) => {
            widths[col.accessorKey] = col.width ?? (index === 0 ? 240 : 180);
        });
        return widths;
    });

    const activeColumns = columns.filter(col => visibleColumns[col.accessorKey]);
    const filteredColumns = useMemo(() => {
        const normalizedQuery = columnQuery.trim().toLowerCase();
        if (!normalizedQuery) return columns;

        return columns.filter((column) => (
            column.header.toLowerCase().includes(normalizedQuery)
            || column.accessorKey.toLowerCase().includes(normalizedQuery)
        ));
    }, [columns, columnQuery]);

    const startResize = (accessorKey: string, event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();

        const startX = event.clientX;
        const startWidth = columnWidths[accessorKey] ?? 180;

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const nextWidth = Math.max(120, Math.min(520, startWidth + moveEvent.clientX - startX));
            setColumnWidths((current) => ({
                ...current,
                [accessorKey]: nextWidth,
            }));
        };

        const handleMouseUp = () => {
            document.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseup", handleMouseUp);
        };

        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };

    const setColumnVisibility = (accessorKey: string, isVisible: boolean) => {
        const visibleCount = Object.values(visibleColumns).filter(Boolean).length;
        if (!isVisible && visibleCount <= 1) return;

        const nextVisibility = {
            ...visibleColumns,
            [accessorKey]: isVisible,
        };

        setVisibleColumns(nextVisibility);

        if (syncColumnVisibility) {
            const params = new URLSearchParams(searchParams);
            const visibleKeys = columns
                .filter((column) => nextVisibility[column.accessorKey])
                .map((column) => column.accessorKey);

            if (visibleKeys.length > 0) {
                params.set("columns", visibleKeys.join(","));
            } else {
                params.delete("columns");
            }

            const nextQuery = params.toString();
            router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname);
        }
    };

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
                    <DropdownMenuContent align="end" className="w-72">
                        <div className="relative p-2">
                            <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={columnQuery}
                                onChange={(event) => setColumnQuery(event.target.value)}
                                placeholder="Search columns"
                                className="h-8 pl-8"
                            />
                        </div>
                        {filteredColumns.map((column) => {
                            const isOnlyVisibleColumn = Boolean(visibleColumns[column.accessorKey])
                                && Object.values(visibleColumns).filter(Boolean).length <= 1;

                            return (
                                <DropdownMenuCheckboxItem
                                    key={column.accessorKey}
                                    className="capitalize"
                                    checked={visibleColumns[column.accessorKey]}
                                    disabled={isOnlyVisibleColumn}
                                    onCheckedChange={(value) => setColumnVisibility(column.accessorKey, !!value)}
                                >
                                    {column.header}
                                </DropdownMenuCheckboxItem>
                            )
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="rounded-md border">
                <Table className="table-fixed">
                    <colgroup>
                        {activeColumns.map((col) => (
                            <col key={col.accessorKey} style={{ width: columnWidths[col.accessorKey] ?? 180 }} />
                        ))}
                    </colgroup>
                    <TableHeader>
                        <TableRow>
                            {activeColumns.map((col) => (
                                <TableHead
                                    key={col.accessorKey}
                                    className="group relative pr-6"
                                    style={{ width: columnWidths[col.accessorKey] ?? 180 }}
                                >
                                    <div className="truncate" title={col.header}>{col.header}</div>
                                    <button
                                        type="button"
                                        className="absolute right-0 top-0 flex h-full w-5 cursor-col-resize items-center justify-center text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                                        onMouseDown={(event) => startResize(col.accessorKey, event)}
                                        title={`Resize ${col.header}`}
                                    >
                                        <GripVertical className="h-3 w-3" />
                                    </button>
                                </TableHead>
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
                                        const value = row.properties?.[col.accessorKey] ?? row[col.accessorKey];
                                        const renderedValue = col.cell ? col.cell(row) : renderValue(value);
                                        const title = typeof value === "string" || typeof value === "number" || typeof value === "boolean"
                                            ? String(value)
                                            : undefined;

                                        return (
                                            <TableCell
                                                key={col.accessorKey}
                                                className="max-w-0"
                                                style={{ width: columnWidths[col.accessorKey] ?? 180 }}
                                            >
                                                {col.cell ? renderedValue : (
                                                    col.accessorKey === linkColumn ? (
                                                        <Link
                                                            href={`${pathname}/${row.id}`}
                                                            className="block truncate font-medium text-blue-600 hover:underline dark:text-blue-400"
                                                            title={title}
                                                        >
                                                            {renderedValue || row.id}
                                                        </Link>
                                                    ) : (
                                                        <div className="truncate" title={title}>
                                                            {renderedValue}
                                                        </div>
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
