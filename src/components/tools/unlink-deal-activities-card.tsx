"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Unlink, Loader2 } from "lucide-react";
import { unlinkDealEngagements } from "@/lib/tools-actions";
import { useToast } from "@/hooks/use-toast";

export function UnlinkDealActivitiesCard() {
    const [dealId, setDealId] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleUnlink = async () => {
        if (!dealId) {
            toast({
                title: "Validation Error",
                description: "Please provide a Deal ID.",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);
        try {
            const result = await unlinkDealEngagements(dealId);

            if (result.success) {
                toast({
                    title: "Success",
                    description: result.message,
                });
                setDealId("");
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
                        Unlink Deal Activities
                    </CardTitle>
                    <CardDescription>
                        Remove all associations between a deal and its activities (emails, calls, etc).
                    </CardDescription>
                </div>
                <Unlink className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                    <Label htmlFor="dealId">Deal ID</Label>
                    <Input
                        id="dealId"
                        placeholder="e.g. 12345"
                        value={dealId}
                        onChange={(e) => setDealId(e.target.value)}
                    />
                </div>
                <Button
                    className="w-full"
                    variant="destructive"
                    onClick={handleUnlink}
                    disabled={isLoading}
                >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Unlink Activities
                </Button>
            </CardContent>
        </Card>
    );
}
