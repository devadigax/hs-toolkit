"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { refreshDashboard } from "@/lib/actions";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function RefreshButton() {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleRefresh = () => {
        startTransition(async () => {
            await refreshDashboard();
            router.refresh(); // Ensure the client-side router checking for new data
        });
    };

    return (
        <Button
            variant="outline"
            size="icon-sm"
            onClick={handleRefresh}
            disabled={isPending}
            title="Refresh data"
        >
            <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
            <span className="sr-only">Refresh data</span>
        </Button>
    );
}
