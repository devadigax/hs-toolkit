"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Link2, Loader2 } from "lucide-react";
import { linkDealToLineItem } from "@/lib/tools-actions";
import { useToast } from "@/hooks/use-toast";

export function LinkLineItemCard() {
    const [dealId, setDealId] = useState("");
    const [lineItemId, setLineItemId] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleLink = async () => {
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
            const result = await linkDealToLineItem(dealId, lineItemId);

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
                        Link Deal & Line Item
                    </CardTitle>
                    <CardDescription>
                        Associate a Line Item to a Deal.
                    </CardDescription>
                </div>
                <Link2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                    <Label htmlFor="link-dealId">Deal ID</Label>
                    <Input
                        id="link-dealId"
                        placeholder="e.g. 12345"
                        value={dealId}
                        onChange={(e) => setDealId(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="link-lineItemId">Line Item ID</Label>
                    <Input
                        id="link-lineItemId"
                        placeholder="e.g. 67890"
                        value={lineItemId}
                        onChange={(e) => setLineItemId(e.target.value)}
                    />
                </div>

                <Button
                    className="w-full"
                    onClick={handleLink}
                    disabled={isLoading}
                >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Link Objects
                </Button>
            </CardContent>
        </Card>
    );
}
