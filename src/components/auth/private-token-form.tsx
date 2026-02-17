"use client";

import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { verifyAndLoginWithToken } from "@/lib/actions/auth";
import { AlertCircle, KeyRound, Loader2 } from "lucide-react";

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
                            className="pl-10 h-11"
                        />
                        <KeyRound className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
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
