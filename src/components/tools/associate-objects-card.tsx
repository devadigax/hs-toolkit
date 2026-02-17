"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link, Loader2 } from "lucide-react";
import { associateObjects } from "@/lib/tools-actions";
import { useToast } from "@/hooks/use-toast";

const OBJECT_TYPES = [
    { value: "deals", label: "Deals" },
    { value: "contacts", label: "Contacts" },
    { value: "companies", label: "Companies" },
    { value: "tickets", label: "Tickets" },
    { value: "engagements", label: "Engagements" },
    { value: "quotes", label: "Quotes" },
    { value: "products", label: "Products" },
    { value: "line_items", label: "Line Items" },
];

export function AssociateObjectsCard() {
    const [fromType, setFromType] = useState("contacts");
    const [fromId, setFromId] = useState("");
    const [toType, setToType] = useState("deals");
    const [toId, setToId] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleAssociate = async () => {
        if (!fromId || !toId) {
            toast({
                title: "Validation Error",
                description: "Please provide IDs for both objects.",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);
        try {
            const result = await associateObjects(fromType, fromId, toType, toId);

            if (result.success) {
                toast({
                    title: "Success",
                    description: result.message,
                });
                setFromId("");
                setToId("");
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
                        Associate Objects
                    </CardTitle>
                    <CardDescription>
                        Link two objects together (e.g. Contact to Deal).
                    </CardDescription>
                </div>
                <Link className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="fromType">From Type</Label>
                        <Select value={fromType} onValueChange={setFromType}>
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
                        <Label htmlFor="toType">To Type</Label>
                        <Select value={toType} onValueChange={setToType}>
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
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="fromId">From ID</Label>
                        <Input
                            id="fromId"
                            placeholder="e.g. 12345"
                            value={fromId}
                            onChange={(e) => setFromId(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="toId">To ID</Label>
                        <Input
                            id="toId"
                            placeholder="e.g. 67890"
                            value={toId}
                            onChange={(e) => setToId(e.target.value)}
                        />
                    </div>
                </div>

                <Button
                    className="w-full"
                    onClick={handleAssociate}
                    disabled={isLoading}
                >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Associate Objects
                </Button>
            </CardContent>
        </Card>
    );
}
