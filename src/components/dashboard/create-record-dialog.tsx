"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Loader2 } from "lucide-react";
import { createObject } from "@/lib/actions/common";
import { OBJECT_PROPERTIES } from "@/lib/actions/config";

// Properties to exclude from creation form
const EXCLUDED_PROPERTIES = [
    "createdate",
    "hs_updated_by_user_id",
    "hs_read_only",
    "hs_all_accessible_team_ids",
    "hs_user_ids_of_all_owners",
    "hubspot_owner_assigneddate",
    "hubspot_team_id",
    "hs_object_id"
];

interface CreateRecordDialogProps {
    type: keyof typeof OBJECT_PROPERTIES;
    triggerLabel?: string;
    onSuccess?: () => void;
}

export function CreateRecordDialog({ type, triggerLabel, onSuccess }: CreateRecordDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Record<string, string>>({});
    const { toast } = useToast();

    // Get properties for this object type, filtering out read-only/system fields
    const properties = (OBJECT_PROPERTIES[type] || [])
        .filter(prop => !EXCLUDED_PROPERTIES.includes(prop) && !prop.startsWith("hs_"));

    const handleInputChange = (key: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await createObject(type, formData);
            if (result.success) {
                toast({
                    title: "Record created",
                    description: `Successfully created new ${type.slice(0, -1)}.`,
                });
                setOpen(false);
                setFormData({});
                if (onSuccess) onSuccess();
            } else {
                toast({
                    variant: "destructive",
                    title: "Creation failed",
                    description: result.error || "Failed to create record.",
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Creation failed",
                description: "An unexpected error occurred.",
            });
        } finally {
            setLoading(false);
        }
    };

    const formatLabel = (key: string) => {
        return key
            .replace(/_/g, " ")
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, str => str.toUpperCase());
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    {triggerLabel || `Create ${type.charAt(0).toUpperCase() + type.slice(1, -1)}`}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New {type.slice(0, -1)}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    {properties.map((prop) => (
                        <div key={prop} className="grid w-full items-center gap-1.5">
                            <Label htmlFor={prop}>{formatLabel(prop)}</Label>
                            <Input
                                id={prop}
                                value={formData[prop] || ""}
                                onChange={(e) => handleInputChange(prop, e.target.value)}
                                placeholder={`Enter ${formatLabel(prop).toLowerCase()}`}
                            />
                        </div>
                    ))}
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
