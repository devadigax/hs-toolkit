"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb } from "lucide-react";
import Link from "next/link";

export function SubmitIdeaCard() {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-base font-medium">
                        Have an idea?
                    </CardTitle>
                    <CardDescription>
                        Suggest a new tool or feature for the toolkit.
                    </CardDescription>
                </div>
                <Lightbulb className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="pt-4">
                <Button asChild className="w-full" variant="outline">
                    <Link href="https://github.com/devadigax/hs-toolkit/issues/new" target="_blank" rel="noopener noreferrer">
                        Submit a Tool Idea
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}
