"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ActivityTypeFilter() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    const currentType = searchParams.get("activityType") || "all";

    const handleChange = (val: string) => {
        const params = new URLSearchParams(searchParams);
        if (val && val !== "all") {
            params.set("activityType", val);
        } else {
            params.delete("activityType");
        }
        params.delete("after"); // reset cursor on filter change
        replace(`${pathname}?${params.toString()}`);
    }

    return (
        <Select value={currentType} onValueChange={handleChange}>
            <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Activities" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Activities</SelectItem>
                <SelectItem value="CALL">Call</SelectItem>
                <SelectItem value="EMAIL">Email</SelectItem>
                <SelectItem value="MEETING">Meeting</SelectItem>
                <SelectItem value="NOTE">Note</SelectItem>
                <SelectItem value="TASK">Task</SelectItem>
                <SelectItem value="CONVERSATION_SESSION">Conversation Session</SelectItem>
            </SelectContent>
        </Select>
    );
}
