"use client";

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { refreshObjectList } from "@/lib/actions";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

interface RefreshObjectButtonProps {
    objectType: string;
}

export function RefreshObjectButton({ objectType }: RefreshObjectButtonProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleRefresh = () => {
        startTransition(async () => {
            await refreshObjectList(objectType);
            router.refresh(); // Ensure the client-side router checking for new data
        });
    };

    return (
        <Button
            variant="outline"
            size="icon-sm"
            onClick={handleRefresh}
            disabled={isPending}
            title="Refresh list"
        >
            <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
            <span className="sr-only">Refresh list</span>
        </Button>
    );
}
