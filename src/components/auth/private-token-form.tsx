"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { verifyAndLoginWithToken } from "@/lib/actions/auth";
import { AlertCircle, KeyRound, Loader2, Info } from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

export function PrivateTokenForm() {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    async function onSubmit(formData: FormData) {
        setError(null);
        startTransition(async () => {
            const result = await verifyAndLoginWithToken(formData);
            if (result?.error) {
                setError(result.error);
            }
        });
    }

    return (
        <div className="w-full space-y-4">
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-muted-foreground">Or login with</span>
                </div>
            </div>

            <form action={onSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="token" className="sr-only">Private Access Token</Label>
                    <div className="relative">
                        <Input
                            id="token"
                            name="token"
                            placeholder="pat-na1-..."
                            required
                            type="password"
                            className="pl-10 pr-10 h-11"
                        />
                        <KeyRound className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        <div className="absolute right-3 top-3">
                            <TooltipProvider>
                                <Tooltip delayDuration={300}>
                                    <TooltipTrigger asChild>
                                        <Info className="h-5 w-5 text-muted-foreground/70 hover:text-primary transition-colors cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-[400px] p-4">
                                        <div className="space-y-3">
                                            <div className="space-y-1">
                                                <h4 className="text-sm font-semibold">Required Scopes</h4>
                                                <p className="text-xs text-muted-foreground">
                                                    Your token needs these permissions to function correctly.
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                {[
                                                    "oauth", "tickets",
                                                    "crm.objects.contacts.read", "crm.objects.contacts.write",
                                                    "crm.objects.companies.read", "crm.objects.companies.write",
                                                    "crm.objects.deals.read", "crm.objects.deals.write",
                                                    "crm.objects.products.read", "crm.objects.products.write",
                                                    "crm.objects.quotes.read", "crm.objects.quotes.write",
                                                    "crm.objects.line_items.read", "crm.objects.line_items.write",
                                                    "crm.objects.users.read",
                                                    "settings.users.read"
                                                ].map((scope) => (
                                                    <Badge key={scope} variant="secondary" className="font-mono text-[10px] justify-center truncate">
                                                        {scope}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                <Button
                    type="submit"
                    className="w-full h-11"
                    variant="secondary"
                    disabled={isPending}
                >
                    {isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying...
                        </>
                    ) : (
                        "Login with Private Token"
                    )}
                </Button>
            </form>
        </div>
    );
}
