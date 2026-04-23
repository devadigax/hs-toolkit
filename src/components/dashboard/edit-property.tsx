"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Check, X, Loader2 } from "lucide-react";
import { updateObjectProperty } from "@/lib/actions/common";
import { useToast } from "@/hooks/use-toast";

interface EditPropertyProps {
    type: string;
    id: string;
    propertyKey: string;
    value: string | number | null | undefined;
    onCancel?: () => void;
    onSave?: () => void;
}

export function EditProperty({ type, id, propertyKey, value: initialValue, onCancel, onSave }: EditPropertyProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(initialValue?.toString() || "");
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleSave = async () => {
        if (value === initialValue?.toString()) {
            setIsEditing(false);
            return;
        }

        setIsLoading(true);
        try {
            const result = await updateObjectProperty(type, id, propertyKey, value);
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
        setValue(initialValue?.toString() || "");
        if (onCancel) onCancel();
    };

    if (isEditing) {
        return (
            <div className="flex items-center space-x-2 w-full">
                <Input
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
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleSave}
                    disabled={isLoading}
                    className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        );
    }

    return (
        <div className="group flex items-center justify-between w-full min-h-[2rem]">
            <span className="text-sm font-medium break-all">{initialValue?.toString()}</span>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                    setValue(initialValue?.toString() || "");
                    setIsEditing(true);
                }}
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                title={`Edit ${propertyKey}`}
            >
                <Pencil className="h-3 w-3" />
            </Button>
        </div>
    );
}
