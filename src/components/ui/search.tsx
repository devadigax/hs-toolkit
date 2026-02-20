"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { Input } from "@/components/ui/input";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function Search({ placeholder, properties = [] }: { placeholder: string, properties?: string[] }) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    const currentSearchField = searchParams.get("searchField") || "all";

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set("query", term);
        } else {
            params.delete("query");
        }
        replace(`${pathname}?${params.toString()}`);
    }, 300);

    const handleFieldChange = (field: string) => {
        const params = new URLSearchParams(searchParams);
        if (field && field !== "all") {
            params.set("searchField", field);
        } else {
            params.delete("searchField");
        }
        replace(`${pathname}?${params.toString()}`);
    }

    return (
        <div className="relative flex flex-1 flex-shrink-0 flex-col sm:flex-row gap-2">
            <div className="flex w-full md:w-[450px] items-center gap-2">
                <Input
                    className="flex-1"
                    placeholder={placeholder}
                    onChange={(e) => handleSearch(e.target.value)}
                    defaultValue={searchParams.get("query")?.toString()}
                />
                <Select value={currentSearchField} onValueChange={handleFieldChange}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Search in field" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Default Fields</SelectItem>
                        {properties.map((prop) => (
                            <SelectItem key={prop} value={prop}>
                                {prop}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
