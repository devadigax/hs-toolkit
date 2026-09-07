"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createSchemaProperty, updateSchemaProperty } from "@/lib/actions";
import { SCHEMA_FIELD_CONFIGS } from "@/lib/schema-config";
import type {
    HubSpotPropertyDefinition,
    HubSpotPropertyGroup,
    HubSpotPropertyOption,
    SchemaPropertyCreateInput,
    SchemaPropertyUpdateInput,
} from "@/types/hubspot";
import { Check, FileUp, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";

const ENUMERATION_FIELD_TYPES = new Set(["select", "radio", "checkbox"]);

function formatObjectName(objectType: string) {
    return objectType.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(value?: string) {
    if (!value) return "-";

    return new Date(value).toLocaleDateString("en-US");
}

function getFieldConfigValue(property: Pick<HubSpotPropertyDefinition, "type" | "fieldType" | "externalOptions" | "referencedObjectType">) {
    return `${property.type}:${property.fieldType}${property.externalOptions && property.referencedObjectType === "OWNER" ? ":OWNER" : ""}`;
}

function getFieldLabel(property: Pick<HubSpotPropertyDefinition, "type" | "fieldType" | "externalOptions" | "referencedObjectType">) {
    return SCHEMA_FIELD_CONFIGS.find((config) => config.value === getFieldConfigValue(property))?.label
        ?? `${property.type} / ${property.fieldType}`;
}

function optionDraftFromProperty(property: HubSpotPropertyDefinition): HubSpotPropertyOption[] {
    return property.options?.map((option, index) => ({
        hidden: Boolean(option.hidden),
        displayOrder: option.displayOrder ?? index,
        description: option.description ?? "",
        label: option.label,
        value: option.value,
    })) ?? [];
}

function getInitialDraft(property: HubSpotPropertyDefinition): SchemaPropertyUpdateInput {
    return {
        label: property.label,
        description: property.description ?? "",
        type: property.type,
        fieldType: property.fieldType,
        hidden: Boolean(property.hidden),
        formField: Boolean(property.formField),
        options: optionDraftFromProperty(property),
        externalOptions: Boolean(property.externalOptions),
        referencedObjectType: property.referencedObjectType,
    };
}

function createOption(index: number): HubSpotPropertyOption {
    return {
        hidden: false,
        displayOrder: index,
        description: "",
        label: `Option ${index + 1}`,
        value: `option_${index + 1}`,
    };
}

function parseCsvRow(row: string) {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let index = 0; index < row.length; index++) {
        const char = row[index];
        const nextChar = row[index + 1];

        if (char === "\"" && nextChar === "\"") {
            current += "\"";
            index++;
            continue;
        }

        if (char === "\"") {
            inQuotes = !inQuotes;
            continue;
        }

        if (char === "," && !inQuotes) {
            values.push(current.trim());
            current = "";
            continue;
        }

        current += char;
    }

    values.push(current.trim());
    return values;
}

function parseOptionRows(input: string): HubSpotPropertyOption[] {
    const rows = input
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
    const dataRows = rows[0]?.toLowerCase().replace(/[\s_]+/g, "").match(/^label,(internal)?value$/)
        ? rows.slice(1)
        : rows;

    return dataRows.map((row, index) => {
        const values = row.includes(",")
            ? parseCsvRow(row)
            : row.split(/\t|\|/).map((part) => part.trim());
        const label = values[0] ?? "";
        const value = values[1] ?? label
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "");

        return {
            hidden: false,
            displayOrder: index,
            description: "",
            label,
            value,
        };
    }).filter((option) => option.label);
}

function BulkOptionsImport({
    disabled,
    onImport,
}: {
    disabled?: boolean;
    onImport: (options: HubSpotPropertyOption[]) => void;
}) {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState("");

    const parsedOptions = parseOptionRows(value);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => setOpen(true)}>
                <FileUp className="h-4 w-4" />
                Import
            </Button>
            <DialogContent className="sm:max-w-[560px]">
                <DialogHeader>
                    <DialogTitle>Import options</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3 py-2">
                    <Textarea
                        value={value}
                        onChange={(event) => setValue(event.target.value)}
                        placeholder={"Label,internal_value\nQualified Lead,qualified_lead\nCustomer,customer"}
                        className="min-h-48 font-mono text-sm"
                    />
                    <div className="text-sm text-muted-foreground">
                        {parsedOptions.length} valid options
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        disabled={parsedOptions.length === 0}
                        onClick={() => {
                            onImport(parsedOptions);
                            setValue("");
                            setOpen(false);
                        }}
                    >
                        <FileUp className="h-4 w-4" />
                        Import
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function toInternalName(label: string) {
    return label
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
}

function CreateSchemaPropertyDialog({
    objectType,
    groups,
    onCreated,
}: {
    objectType: string;
    groups: HubSpotPropertyGroup[];
    onCreated: (property: HubSpotPropertyDefinition) => void;
}) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [draft, setDraft] = useState<SchemaPropertyCreateInput>({
        label: "",
        name: "",
        groupName: groups[0]?.name ?? "",
        description: "",
        type: "string",
        fieldType: "text",
        hidden: false,
        formField: true,
        options: [],
    });
    const { toast } = useToast();
    const router = useRouter();

    const isEnumeration = draft.type === "enumeration" || ENUMERATION_FIELD_TYPES.has(draft.fieldType);
    const isUserField = draft.externalOptions && draft.referencedObjectType === "OWNER";
    const fieldValue = `${draft.type}:${draft.fieldType}${isUserField ? ":OWNER" : ""}`;

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen && !isPending) {
            setDraft({
                label: "",
                name: "",
                groupName: groups[0]?.name ?? "",
                description: "",
                type: "string",
                fieldType: "text",
                hidden: false,
                formField: true,
                options: [],
            });
        }

        setOpen(nextOpen);
    };

    const handleSave = () => {
        startTransition(async () => {
            const result = await createSchemaProperty(objectType, draft);

            if (result.success) {
                toast({
                    title: "Property created",
                    description: `${draft.label || draft.name} has been added.`,
                });
                if (result.data) {
                    onCreated(result.data);
                }
                setOpen(false);
                router.refresh();
                return;
            }

            toast({
                variant: "destructive",
                title: "Property creation failed",
                description: result.error,
            });
        });
    };

    const setOption = (index: number, patch: Partial<HubSpotPropertyOption>) => {
        setDraft((current) => ({
            ...current,
            options: current.options.map((option, optionIndex) => (
                optionIndex === index ? { ...option, ...patch } : option
            )),
        }));
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <Button type="button" onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4" />
                Create Property
            </Button>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[720px]">
                <DialogHeader>
                    <DialogTitle>Create property</DialogTitle>
                </DialogHeader>

                <div className="grid gap-5 py-2">
                    <div className="grid gap-2">
                        <Label htmlFor="new-property-label">Display label</Label>
                        <Input
                            id="new-property-label"
                            value={draft.label}
                            onChange={(event) => {
                                const label = event.target.value;
                                setDraft((current) => ({
                                    ...current,
                                    label,
                                    name: current.name ? current.name : toInternalName(label),
                                }));
                            }}
                            disabled={isPending}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="new-property-name">Internal name</Label>
                        <Input
                            id="new-property-name"
                            value={draft.name}
                            onChange={(event) => setDraft((current) => ({ ...current, name: toInternalName(event.target.value) }))}
                            disabled={isPending}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Group</Label>
                        <Select
                            value={draft.groupName}
                            onValueChange={(value) => setDraft((current) => ({ ...current, groupName: value }))}
                            disabled={isPending}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {groups.map((group) => (
                                    <SelectItem key={group.name} value={group.name}>
                                        {group.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>Field type</Label>
                        <Select
                            value={fieldValue}
                            onValueChange={(value) => {
                                const config = SCHEMA_FIELD_CONFIGS.find((item) => item.value === value);
                                if (!config) return;

                                setDraft((current) => {
                                    const nextIsEnumeration = config.type === "enumeration";
                                    const nextIsUser = config.referencedObjectType === "OWNER";

                                    return {
                                        ...current,
                                        type: config.type,
                                        fieldType: config.fieldType,
                                        externalOptions: nextIsUser,
                                        referencedObjectType: config.referencedObjectType,
                                        formField: nextIsUser ? false : current.formField,
                                        options: nextIsEnumeration && !nextIsUser && current.options.length === 0
                                            ? [createOption(0)]
                                            : current.options,
                                    };
                                });
                            }}
                            disabled={isPending}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {SCHEMA_FIELD_CONFIGS.map((config) => (
                                    <SelectItem key={config.value} value={config.value}>
                                        {config.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="new-property-description">Description</Label>
                        <Textarea
                            id="new-property-description"
                            value={draft.description}
                            onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                            disabled={isPending}
                        />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="flex items-center justify-between rounded-md border p-3">
                            <Label htmlFor="new-property-form-field">Show in forms</Label>
                            <Switch
                                id="new-property-form-field"
                                checked={draft.formField}
                                onCheckedChange={(checked) => setDraft((current) => ({ ...current, formField: checked }))}
                                disabled={isPending || Boolean(isUserField)}
                            />
                        </div>
                        <div className="flex items-center justify-between rounded-md border p-3">
                            <Label htmlFor="new-property-hidden">Hidden</Label>
                            <Switch
                                id="new-property-hidden"
                                checked={draft.hidden}
                                onCheckedChange={(checked) => setDraft((current) => ({ ...current, hidden: checked }))}
                                disabled={isPending}
                            />
                        </div>
                    </div>

                    {isEnumeration && !isUserField && (
                        <div className="grid gap-3">
                            <div className="flex items-center justify-between gap-3">
                                <Label>Options</Label>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={isPending}
                                        onClick={() => setDraft((current) => ({
                                            ...current,
                                            options: [...current.options, createOption(current.options.length)],
                                        }))}
                                    >
                                        <Plus className="h-4 w-4" />
                                        Add Option
                                    </Button>
                                    <BulkOptionsImport
                                        disabled={isPending}
                                        onImport={(options) => setDraft((current) => ({ ...current, options }))}
                                    />
                                </div>
                            </div>
                            {draft.options.map((option, index) => (
                                <div key={`${option.value}-${index}`} className="grid gap-2 rounded-md border p-3 md:grid-cols-[1fr_1fr_auto_auto] md:items-center">
                                    <Input
                                        value={option.label}
                                        placeholder="Label"
                                        onChange={(event) => setOption(index, { label: event.target.value })}
                                        disabled={isPending}
                                    />
                                    <Input
                                        value={option.value}
                                        placeholder="Internal value"
                                        onChange={(event) => setOption(index, { value: event.target.value })}
                                        disabled={isPending}
                                    />
                                    <div className="flex items-center gap-2">
                                        <Switch
                                            id={`new-property-option-${index}-hidden`}
                                            checked={option.hidden}
                                            onCheckedChange={(checked) => setOption(index, { hidden: checked })}
                                            disabled={isPending}
                                        />
                                        <Label htmlFor={`new-property-option-${index}-hidden`} className="text-sm">
                                            Hidden
                                        </Label>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        disabled={isPending || draft.options.length <= 1}
                                        onClick={() => setDraft((current) => ({
                                            ...current,
                                            options: current.options.filter((_, optionIndex) => optionIndex !== index),
                                        }))}
                                        title="Remove option"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    {isUserField && (
                        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                            HubSpot User fields pull options from portal users and cannot be used in forms.
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
                        Cancel
                    </Button>
                    <Button type="button" onClick={handleSave} disabled={isPending}>
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        Create
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function SchemaPropertyEditor({
    objectType,
    property,
    open,
    onOpenChange,
    onSaved,
}: {
    objectType: string;
    property: HubSpotPropertyDefinition;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSaved: (property: HubSpotPropertyDefinition) => void;
}) {
    const [draft, setDraft] = useState<SchemaPropertyUpdateInput>(() => getInitialDraft(property));
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const router = useRouter();

    const isDefinitionReadOnly = Boolean(property.modificationMetadata?.readOnlyDefinition);
    const areOptionsReadOnly = Boolean(property.modificationMetadata?.readOnlyOptions || property.externalOptions);
    const isEnumeration = draft.type === "enumeration" || ENUMERATION_FIELD_TYPES.has(draft.fieldType);
    const draftFieldValue = `${draft.type}:${draft.fieldType}${draft.externalOptions && draft.referencedObjectType === "OWNER" ? ":OWNER" : ""}`;
    const isExistingUserField = Boolean(property.externalOptions && property.referencedObjectType === "OWNER");
    const fieldValue = SCHEMA_FIELD_CONFIGS.some((config) => config.value === draftFieldValue)
        ? draftFieldValue
        : getFieldConfigValue(property);

    const handleOpenChange = (nextOpen: boolean) => {
        if (!nextOpen && !isPending) {
            setDraft(getInitialDraft(property));
        }

        onOpenChange(nextOpen);
    };

    const setOption = (index: number, patch: Partial<HubSpotPropertyOption>) => {
        setDraft((current) => ({
            ...current,
            options: current.options.map((option, optionIndex) => (
                optionIndex === index ? { ...option, ...patch } : option
            )),
        }));
    };

    const handleSave = () => {
        startTransition(async () => {
            const result = await updateSchemaProperty(objectType, property.name, draft);

            if (result.success) {
                toast({
                    title: "Schema updated",
                    description: `${draft.label || property.name} has been saved.`,
                });
                if (result.data) {
                    onSaved(result.data);
                }
                onOpenChange(false);
                router.refresh();
                return;
            }

            toast({
                variant: "destructive",
                title: "Schema update failed",
                description: result.error,
            });
        });
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[720px]">
                <DialogHeader>
                    <DialogTitle>Edit {property.label}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-5 py-2">
                    <div className="grid gap-2">
                        <Label htmlFor={`${property.name}-label`}>Display label</Label>
                        <Input
                            id={`${property.name}-label`}
                            value={draft.label}
                            onChange={(event) => setDraft((current) => ({ ...current, label: event.target.value }))}
                            disabled={isDefinitionReadOnly || isPending}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor={`${property.name}-internal-name`}>Internal name</Label>
                        <Input id={`${property.name}-internal-name`} value={property.name} disabled />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor={`${property.name}-description`}>Description</Label>
                        <Textarea
                            id={`${property.name}-description`}
                            value={draft.description}
                            onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                            disabled={isDefinitionReadOnly || isPending}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Field type</Label>
                        <Select
                            value={fieldValue}
                            onValueChange={(value) => {
                                const config = SCHEMA_FIELD_CONFIGS.find((item) => item.value === value);
                                if (!config) return;

                                setDraft((current) => {
                                    const nextIsEnumeration = config.type === "enumeration";
                                    const options = nextIsEnumeration && current.options.length === 0
                                        ? [createOption(0)]
                                        : current.options;

                                return {
                                    ...current,
                                    type: config.type,
                                    fieldType: config.fieldType,
                                    externalOptions: config.referencedObjectType === "OWNER",
                                    referencedObjectType: config.referencedObjectType,
                                    formField: config.referencedObjectType === "OWNER" ? false : current.formField,
                                    options,
                                };
                            });
                            }}
                            disabled={isDefinitionReadOnly || isPending}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {SCHEMA_FIELD_CONFIGS.map((config) => (
                                    <SelectItem
                                        key={config.value}
                                        value={config.value}
                                        disabled={config.referencedObjectType === "OWNER" && !isExistingUserField}
                                    >
                                        {config.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="flex items-center justify-between rounded-md border p-3">
                            <Label htmlFor={`${property.name}-form-field`}>Show in forms</Label>
                            <Switch
                                id={`${property.name}-form-field`}
                                checked={draft.formField}
                                onCheckedChange={(checked) => setDraft((current) => ({ ...current, formField: checked }))}
                                disabled={isDefinitionReadOnly || isPending}
                            />
                        </div>
                        <div className="flex items-center justify-between rounded-md border p-3">
                            <Label htmlFor={`${property.name}-hidden`}>Hidden</Label>
                            <Switch
                                id={`${property.name}-hidden`}
                                checked={draft.hidden}
                                onCheckedChange={(checked) => setDraft((current) => ({ ...current, hidden: checked }))}
                                disabled={isDefinitionReadOnly || isPending}
                            />
                        </div>
                    </div>

                    {isEnumeration && (
                        <div className="grid gap-3">
                            <div className="flex items-center justify-between gap-3">
                                <Label>Options</Label>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    disabled={isDefinitionReadOnly || areOptionsReadOnly || isPending}
                                    onClick={() => setDraft((current) => ({
                                        ...current,
                                        options: [...current.options, createOption(current.options.length)],
                                    }))}
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Option
                                </Button>
                                <BulkOptionsImport
                                    disabled={isDefinitionReadOnly || areOptionsReadOnly || isPending}
                                    onImport={(options) => setDraft((current) => ({
                                        ...current,
                                        options,
                                    }))}
                                />
                            </div>

                            <div className="grid gap-2">
                                {draft.options.map((option, index) => (
                                    <div key={`${option.value}-${index}`} className="grid gap-2 rounded-md border p-3 md:grid-cols-[1fr_1fr_auto_auto] md:items-center">
                                        <Input
                                            value={option.label}
                                            placeholder="Label"
                                            onChange={(event) => setOption(index, { label: event.target.value })}
                                            disabled={isDefinitionReadOnly || areOptionsReadOnly || isPending}
                                        />
                                        <Input
                                            value={option.value}
                                            placeholder="Value"
                                            onChange={(event) => setOption(index, { value: event.target.value })}
                                            disabled={isDefinitionReadOnly || areOptionsReadOnly || isPending}
                                        />
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                id={`${property.name}-option-${index}-hidden`}
                                                checked={option.hidden}
                                                onCheckedChange={(checked) => setOption(index, { hidden: checked })}
                                                disabled={isDefinitionReadOnly || areOptionsReadOnly || isPending}
                                            />
                                            <Label htmlFor={`${property.name}-option-${index}-hidden`} className="text-sm">
                                                Hidden
                                            </Label>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon-sm"
                                            disabled={isDefinitionReadOnly || areOptionsReadOnly || isPending || draft.options.length <= 1}
                                            onClick={() => setDraft((current) => ({
                                                ...current,
                                                options: current.options.filter((_, optionIndex) => optionIndex !== index),
                                            }))}
                                            title="Remove option"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {isDefinitionReadOnly && (
                        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                            HubSpot marks this property definition as read-only.
                        </div>
                    )}
                    {!isDefinitionReadOnly && areOptionsReadOnly && isEnumeration && (
                        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                            HubSpot manages these options externally.
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
                        Cancel
                    </Button>
                    <Button type="button" onClick={handleSave} disabled={isDefinitionReadOnly || isPending}>
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function SchemaPropertiesTable({
    objectType,
    properties,
    groups,
}: {
    objectType: string;
    properties: HubSpotPropertyDefinition[];
    groups: HubSpotPropertyGroup[];
}) {
    const [items, setItems] = useState(properties);
    const [query, setQuery] = useState("");
    const [editingProperty, setEditingProperty] = useState<HubSpotPropertyDefinition | null>(null);

    const filteredItems = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        if (!normalizedQuery) return items;

        return items.filter((property) => (
            property.name.toLowerCase().includes(normalizedQuery)
            || property.label.toLowerCase().includes(normalizedQuery)
            || property.groupName.toLowerCase().includes(normalizedQuery)
            || property.type.toLowerCase().includes(normalizedQuery)
            || property.fieldType.toLowerCase().includes(normalizedQuery)
        ));
    }, [items, query]);

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h3 className="text-lg font-semibold">{formatObjectName(objectType)} Properties</h3>
                    <p className="text-sm text-muted-foreground">{items.length} properties</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <div className="relative w-full md:w-[320px]">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder="Search properties"
                            className="pl-9"
                        />
                    </div>
                    <CreateSchemaPropertyDialog
                        objectType={objectType}
                        groups={groups}
                        onCreated={(property) => setItems((current) => [...current, property])}
                    />
                </div>
            </div>

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Property</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Group</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Updated</TableHead>
                        <TableHead className="w-[80px] text-right">Edit</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredItems.map((property) => {
                        const isReadOnly = Boolean(property.modificationMetadata?.readOnlyDefinition);

                        return (
                            <TableRow key={property.name}>
                                <TableCell className="min-w-[260px] whitespace-normal">
                                    <div className="space-y-1">
                                        <div className="font-medium">{property.label}</div>
                                        <div className="font-mono text-xs text-muted-foreground">{property.name}</div>
                                        {property.description && (
                                            <div className="max-w-[520px] text-xs text-muted-foreground">{property.description}</div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="min-w-[160px] whitespace-normal">
                                    <div className="space-y-1">
                                        <div>{getFieldLabel(property)}</div>
                                        {property.options?.length > 0 && (
                                            <div className="text-xs text-muted-foreground">{property.options.length} options</div>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>{property.groupName}</TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {property.hubspotDefined && <Badge variant="secondary">HubSpot</Badge>}
                                        {property.hidden && <Badge variant="outline">Hidden</Badge>}
                                        {property.formField && <Badge variant="outline">Form</Badge>}
                                        {isReadOnly && <Badge variant="outline">Read-only</Badge>}
                                    </div>
                                </TableCell>
                                <TableCell>{formatDate(property.updatedAt)}</TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon-sm"
                                        onClick={() => setEditingProperty(property)}
                                        title={`Edit ${property.label}`}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                    {filteredItems.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                No properties found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>

            {editingProperty && (
                <SchemaPropertyEditor
                    objectType={objectType}
                    property={editingProperty}
                    open={Boolean(editingProperty)}
                    onOpenChange={(open) => {
                        if (!open) setEditingProperty(null);
                    }}
                    onSaved={(updatedProperty) => {
                        setItems((current) => current.map((property) => (
                            property.name === updatedProperty.name ? updatedProperty : property
                        )));
                    }}
                />
            )}
        </div>
    );
}
