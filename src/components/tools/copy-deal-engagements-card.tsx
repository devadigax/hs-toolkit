"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Copy, Loader2 } from "lucide-react";
import { copyDealEngagements } from "@/lib/tools-actions";
import { useToast } from "@/hooks/use-toast";

export function CopyDealEngagementsCard() {
    const [sourceId, setSourceId] = useState("");
    const [targetId, setTargetId] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleCopy = async () => {
        if (!sourceId || !targetId) {
            toast({
                title: "Validation Error",
                description: "Please provide both Source and Target Deal IDs.",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);
        try {
            const result = await copyDealEngagements(sourceId, targetId);

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
                        Copy Deal Engagements
                    </CardTitle>
                    <CardDescription>
                        Copy notes, calls, emails from one deal to another.
                    </CardDescription>
                </div>
                <Copy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
                <div className="space-y-2">
                    <Label htmlFor="sourceId">Source Deal ID</Label>
                    <Input
                        id="sourceId"
                        placeholder="e.g. 12345"
                        value={sourceId}
                        onChange={(e) => setSourceId(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="targetId">Target Deal ID</Label>
                    <Input
                        id="targetId"
                        placeholder="e.g. 67890"
                        value={targetId}
                        onChange={(e) => setTargetId(e.target.value)}
                    />
                </div>
                <Button
                    className="w-full"
                    onClick={handleCopy}
                    disabled={isLoading}
                >
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Copy Engagements
                </Button>
            </CardContent>
        </Card>
    );
}
