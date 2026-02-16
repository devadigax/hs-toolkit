"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function PaginationControls({ nextCursor }: { nextCursor?: string }) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleNext = () => {
        if (!nextCursor) return;
        const params = new URLSearchParams(searchParams);
        params.set("after", nextCursor);
        router.push(`?${params.toString()}`);
    };

    const handlePrevious = () => {
        router.back();
    };

    return (
        <div className="flex items-center justify-end space-x-2 py-4">
            <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                disabled={!searchParams.get("after")}
            >
                <ChevronLeft className="h-4 w-4" />
                Previous
            </Button>
            <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={!nextCursor}
            >
                Next
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    );
}
