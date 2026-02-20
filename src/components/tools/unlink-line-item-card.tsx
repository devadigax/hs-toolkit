"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Unlink, Loader2 } from "lucide-react";
import { unlinkDealFromLineItem } from "@/lib/tools-actions";
import { useToast } from "@/hooks/use-toast";

export function UnlinkLineItemCard() {
    const [dealId, setDealId] = useState("");
    const [lineItemId, setLineItemId] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleUnlink = async () => {
        if (!dealId || !lineItemId) {
            toast({
                title: "Validation Error",
                description: "Please provide IDs for both Deal and Line Item.",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);
        try {
            const result = await unlinkDealFromLineItem(dealId, lineItemId);

            if (result.success) {
                toast({
                    title: "Success",
                    description: result.message,
                });
                setDealId("");
                setLineItemId("");
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
                        Unlink Deal & Line Item
                    </CardTitle>
                    <CardDescription>
                        Remove the association between a Line Item and a Deal.
                    </CardDescription>
                </div>
                <Unlink className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                    <Label htmlFor="unlink-dealId">Deal ID</Label>
                    <Input
                        id="unlink-dealId"
                        placeholder="e.g. 12345"
                        value={dealId}
                        onChange={(e) => setDealId(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="unlink-lineItemId">Line Item ID</Label>
                    <Input
                        id="unlink-lineItemId"
                        placeholder="e.g. 67890"
                        value={lineItemId}
                        onChange={(e) => setLineItemId(e.target.value)}
                    />
                </div>

                <Button
                    variant="destructive"
                    className="w-full"
                    onClick={handleUnlink}
                    disabled={isLoading}
                >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Unlink Objects
                </Button>
            </CardContent>
        </Card>
    );
}
