"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Copy, Loader2, Check } from "lucide-react";
import { copyObjectEngagements } from "@/lib/tools-actions";
import { useToast } from "@/hooks/use-toast";

const OBJECT_TYPES = [
    { value: "deals", label: "Deals" },
    { value: "contacts", label: "Contacts" },
    { value: "companies", label: "Companies" },
    { value: "tickets", label: "Tickets" },
    { value: "quotes", label: "Quotes" },
    { value: "products", label: "Products" },
];

export function CopyEngagementsCard() {
    const [objectType, setObjectType] = useState("deals");
    const [sourceId, setSourceId] = useState("");
    const [targetId, setTargetId] = useState("");
    const [shouldDelete, setShouldDelete] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleCopy = async () => {
        if (!sourceId || !targetId) {
            toast({
                title: "Validation Error",
                description: "Please provide both Source and Target IDs.",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);
        try {
            const result = await copyObjectEngagements(objectType, sourceId, targetId, shouldDelete);

            if (result.success) {
                toast({
                    title: "Success",
                    description: result.message,
                });
                setSourceId("");
                setTargetId("");
            } else {
                toast({
                    title: "Error",
                    description: result.message,
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "An unexpected error occurred.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-base font-medium">
                        Copy or Move Engagements
                    </CardTitle>
                    <CardDescription>
                        Copy (or move) notes, calls, emails from one record to another.
                    </CardDescription>
                </div>
                <Copy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
                <div className="space-y-2 hidden">
                    <Label htmlFor="objectType">Object Type</Label>
                    <Select value="deals" disabled>
                        <SelectTrigger>
                            <SelectValue placeholder="Deals" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="deals">Deals</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="text-sm text-muted-foreground pb-2">
                    Copying engagements between <strong>Deals</strong>.
                </div>
                <div className="space-y-2">
                    <Label htmlFor="sourceId">Source ID</Label>
                    <Input
                        id="sourceId"
                        placeholder="e.g. 12345"
                        value={sourceId}
                        onChange={(e) => setSourceId(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="targetId">Target ID</Label>
                    <Input
                        id="targetId"
                        placeholder="e.g. 67890"
                        value={targetId}
                        onChange={(e) => setTargetId(e.target.value)}
                    />
                </div>
                <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                        id="shouldDelete"
                        checked={shouldDelete}
                        onCheckedChange={(checked) => setShouldDelete(checked as boolean)}
                    />
                    <Label htmlFor="shouldDelete" className="text-sm font-normal cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
                        Delete from source after copy (Move)
                    </Label>
                </div>
                <Button
                    className="w-full"
                    onClick={handleCopy}
                    disabled={isLoading}
                    variant={shouldDelete ? "destructive" : "default"}
                >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {shouldDelete ? "Move Engagements" : "Copy Engagements"}
                </Button>
            </CardContent>
        </Card>
    );
}
