"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Unlink, Loader2 } from "lucide-react";
import { unlinkObjectEngagements } from "@/lib/tools-actions";
import { useToast } from "@/hooks/use-toast";

const OBJECT_TYPES = [
    { value: "deals", label: "Deals" },
    { value: "contacts", label: "Contacts" },
    { value: "companies", label: "Companies" },
    { value: "tickets", label: "Tickets" },
];

export function UnlinkEngagementsCard() {
    const [objectType, setObjectType] = useState("deals");
    const [objectId, setObjectId] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleUnlink = async () => {
        if (!objectId) {
            toast({
                title: "Validation Error",
                description: "Please provide a Record ID.",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);
        try {
            const result = await unlinkObjectEngagements(objectType, objectId);

            if (result.success) {
                toast({
                    title: "Success",
                    description: result.message,
                });
                setObjectId("");
            } else {
                toast({
                    title: "Error",
                    description: result.message,
                    variant: "destructive",
                });
            }
        } catch {
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
                        Unlink Engagements
                    </CardTitle>
                    <CardDescription>
                        Remove all associations between a record and its engagements (emails, calls, etc).
                    </CardDescription>
                </div>
                <Unlink className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                    <Label htmlFor="objectType">Object Type</Label>
                    <Select value={objectType} onValueChange={setObjectType}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                            {OBJECT_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="objectId">Record ID</Label>
                    <Input
                        id="objectId"
                        placeholder="e.g. 12345"
                        value={objectId}
                        onChange={(e) => setObjectId(e.target.value)}
                    />
                </div>
                <Button
                    className="w-full"
                    variant="destructive"
                    onClick={handleUnlink}
                    disabled={isLoading}
                >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Unlink Engagements
                </Button>
            </CardContent>
        </Card>
    );
}
