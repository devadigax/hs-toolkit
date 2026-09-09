"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Check, X, Loader2 } from "lucide-react";
import { updateObjectProperty } from "@/lib/actions/common";
import { useToast } from "@/hooks/use-toast";
import type { HubSpotPropertyDefinition } from "@/types/hubspot";

interface EditPropertyProps {
    type: string;
    id: string;
    propertyKey: string;
    value: string | number | boolean | null | undefined;
    propertyDefinition?: HubSpotPropertyDefinition;
    onCancel?: () => void;
    onSave?: () => void;
}

function toStringValue(value: string | number | boolean | null | undefined) {
    if (value === null || value === undefined) return "";
    return String(value);
}

function getDateInputValue(value: string, propertyDefinition?: HubSpotPropertyDefinition) {
    if (!value) return "";

    const maybeTimestamp = /^\d+$/.test(value) ? Number(value) : NaN;
    const date = Number.isFinite(maybeTimestamp) ? new Date(maybeTimestamp) : new Date(value);

    if (Number.isNaN(date.getTime())) {
        return propertyDefinition?.type === "datetime" ? value.slice(0, 16) : value.slice(0, 10);
    }

    return propertyDefinition?.type === "datetime"
        ? date.toISOString().slice(0, 16)
        : date.toISOString().slice(0, 10);
}

function getDisplayValue(value: string, propertyDefinition?: HubSpotPropertyDefinition) {
    if (!value) return "-";

    if (propertyDefinition?.type === "bool" || propertyDefinition?.fieldType === "booleancheckbox") {
        return value === "true" ? "Yes" : "No";
    }

    if (propertyDefinition?.type === "enumeration" && propertyDefinition.options?.length) {
        const optionLabels = new Map(propertyDefinition.options.map((option) => [option.value, option.label]));
        return value
            .split(";")
            .map((item) => optionLabels.get(item) ?? item)
            .filter(Boolean)
            .join(", ") || "-";
    }

    return value;
}

function getSubmitValue(value: string, propertyDefinition?: HubSpotPropertyDefinition) {
    if (propertyDefinition?.type === "datetime" && value) {
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? value : date.toISOString();
    }

    return value;
}

export function EditProperty({ type, id, propertyKey, value: initialValue, propertyDefinition, onCancel, onSave }: EditPropertyProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(toStringValue(initialValue));
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const isReadOnly = Boolean(propertyDefinition?.modificationMetadata?.readOnlyValue);
    const displayValue = getDisplayValue(toStringValue(initialValue), propertyDefinition);
    const hasLocalOptions = Boolean(propertyDefinition?.options?.length && !propertyDefinition.externalOptions);
    const isMultiCheckbox = propertyDefinition?.type === "enumeration" && propertyDefinition.fieldType === "checkbox" && hasLocalOptions;

    const handleSave = async () => {
        const submitValue = getSubmitValue(value, propertyDefinition);

        if (submitValue === toStringValue(initialValue)) {
            setIsEditing(false);
            return;
        }

        setIsLoading(true);
        try {
            const result = await updateObjectProperty(type, id, propertyKey, submitValue);
            if (result.success) {
                toast({
                    title: "Property updated",
                    description: `${propertyKey} has been updated successfully.`,
                });
                setIsEditing(false);
                if (onSave) onSave();
            } else {
                toast({
                    variant: "destructive",
                    title: "Update failed",
                    description: "error" in result ? result.error : "Failed to update property.",
                });
            }
        } catch {
            toast({
                variant: "destructive",
                title: "Update failed",
                description: "An unexpected error occurred.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setValue(toStringValue(initialValue));
        if (onCancel) onCancel();
    };

    const startEditing = () => {
        const initialStringValue = toStringValue(initialValue);
        setValue(
            propertyDefinition?.type === "date" || propertyDefinition?.type === "datetime"
                ? getDateInputValue(initialStringValue, propertyDefinition)
                : initialStringValue
        );
        setIsEditing(true);
    };

    const toggleOption = (optionValue: string, checked: boolean) => {
        const values = new Set(value.split(";").filter(Boolean));
        if (checked) {
            values.add(optionValue);
        } else {
            values.delete(optionValue);
        }
        setValue(Array.from(values).join(";"));
    };

    const renderEditor = () => {
        if (isMultiCheckbox) {
            const selectedValues = new Set(value.split(";").filter(Boolean));

            return (
                <div className="max-h-44 w-full space-y-2 overflow-y-auto rounded-md border p-2">
                    {propertyDefinition?.options.map((option) => (
                        <div key={option.value} className="flex items-center gap-2">
                            <Checkbox
                                id={`${propertyKey}-${option.value}`}
                                checked={selectedValues.has(option.value)}
                                onCheckedChange={(checked) => toggleOption(option.value, checked === true)}
                                disabled={isLoading}
                            />
                            <Label htmlFor={`${propertyKey}-${option.value}`} className="text-sm">
                                {option.label}
                            </Label>
                        </div>
                    ))}
                </div>
            );
        }

        if (propertyDefinition?.type === "enumeration" && hasLocalOptions) {
            return (
                <Select value={value} onValueChange={setValue} disabled={isLoading}>
                    <SelectTrigger className="h-8 w-full text-sm">
                        <SelectValue placeholder="Select value" />
                    </SelectTrigger>
                    <SelectContent>
                        {propertyDefinition.options.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            );
        }

        if (propertyDefinition?.type === "bool" || propertyDefinition?.fieldType === "booleancheckbox") {
            return (
                <div className="flex h-8 items-center gap-2">
                    <Checkbox
                        id={`${propertyKey}-boolean`}
                        checked={value === "true"}
                        onCheckedChange={(checked) => setValue(checked ? "true" : "false")}
                        disabled={isLoading}
                    />
                    <Label htmlFor={`${propertyKey}-boolean`} className="text-sm">
                        Yes
                    </Label>
                </div>
            );
        }

        if (propertyDefinition?.type === "date" || propertyDefinition?.type === "datetime") {
            return (
                <Input
                    type={propertyDefinition.type === "datetime" ? "datetime-local" : "date"}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="h-8 text-sm"
                    autoFocus
                    disabled={isLoading}
                />
            );
        }

        if (propertyDefinition?.fieldType === "textarea") {
            return (
                <Textarea
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="min-h-20 text-sm"
                    autoFocus
                    disabled={isLoading}
                />
            );
        }

        return (
            <Input
                type={propertyDefinition?.type === "number" ? "number" : "text"}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="h-8 text-sm"
                autoFocus
                onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave();
                    if (e.key === "Escape") handleCancel();
                }}
                disabled={isLoading}
            />
        );
    };

    if (isEditing) {
        return (
            <div className="flex w-full items-start gap-2">
                <div className="min-w-0 flex-1">{renderEditor()}</div>
                <div className="flex shrink-0 items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleSave}
                        disabled={isLoading}
                        className="h-8 w-8 text-green-600 hover:bg-green-50 hover:text-green-700"
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleCancel}
                        disabled={isLoading}
                        className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="group flex items-center justify-between w-full min-h-[2rem]">
            <span className="min-w-0 break-words text-sm font-medium">{displayValue}</span>
            {!isReadOnly && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={startEditing}
                    className="h-6 w-6 shrink-0 opacity-0 transition-opacity text-muted-foreground hover:text-foreground group-hover:opacity-100"
                    title={`Edit ${propertyKey}`}
                >
                    <Pencil className="h-3 w-3" />
                </Button>
            )}
        </div>
    );
}
