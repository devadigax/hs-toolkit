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
            size="sm"
            onClick={handleRefresh}
            disabled={isPending}
        >
            <RefreshCw className={`mr-2 h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
            Refresh List
        </Button>
    );
}
