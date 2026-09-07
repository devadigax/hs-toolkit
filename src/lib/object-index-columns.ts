import type { HubSpotPropertyDefinition } from "@/types/hubspot";

export type ObjectIndexColumn = {
    header: string;
    accessorKey: string;
    hiddenByDefault?: boolean;
    width?: number;
};

const NON_SCHEMA_COLUMNS = new Set(["fullName", "createdAt", "lastModifiedAt", "source"]);
const RAW_DATE_COLUMNS = new Set(["createdate", "lastmodifieddate", "hs_createdate", "hs_lastmodifieddate", "hs_object_source"]);

export function parseSelectedColumns(value?: string) {
    return value
        ?.split(",")
        .map((item) => item.trim())
        .filter(Boolean);
}

export function getSchemaPropertyNames(properties: HubSpotPropertyDefinition[]) {
    return properties.map((property) => property.name);
}

export function getRequestedSchemaProperties(selectedColumns: string[] | undefined, defaultProperties: string[]) {
    return Array.from(new Set([...(selectedColumns ?? []), ...defaultProperties]))
        .filter((key) => !NON_SCHEMA_COLUMNS.has(key));
}

export function buildSchemaIndexColumns({
    schemaProperties,
    leadingColumns,
    trailingColumns,
    defaultVisible,
}: {
    schemaProperties: HubSpotPropertyDefinition[];
    leadingColumns: ObjectIndexColumn[];
    trailingColumns: ObjectIndexColumn[];
    defaultVisible: string[];
}) {
    const usedKeys = new Set([
        ...leadingColumns.map((column) => column.accessorKey),
        ...trailingColumns.map((column) => column.accessorKey),
        ...RAW_DATE_COLUMNS,
    ]);
    const defaultVisibleSet = new Set(defaultVisible);
    const columns: ObjectIndexColumn[] = [
        ...leadingColumns,
        ...schemaProperties
            .filter((property) => !usedKeys.has(property.name))
            .map((property) => ({
                header: property.label || property.name,
                accessorKey: property.name,
                hiddenByDefault: !defaultVisibleSet.has(property.name),
                width: property.name.includes("description") ? 260 : 180,
            })),
        ...trailingColumns,
    ];

    return columns;
}
