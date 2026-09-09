"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PropertyItem } from "@/components/dashboard/property-item";
import { Search } from "lucide-react";
import type { HubSpotPropertyDefinition } from "@/types/hubspot";

interface PropertyGridProps {
    properties: Record<string, string | number | boolean | null | undefined>;
    propertyDefinitions?: HubSpotPropertyDefinition[];
    type: string;
    id: string;
}

export function PropertyGrid({ properties, propertyDefinitions = [], type, id }: PropertyGridProps) {
    const [showAll, setShowAll] = useState(false);
    const [query, setQuery] = useState("");
    const normalizedQuery = query.trim().toLowerCase();
    const definitionMap = new Map(propertyDefinitions.map((definition) => [definition.name, definition]));
    const orderMap = new Map(propertyDefinitions.map((definition, index) => [definition.name, definition.displayOrder ?? index]));

    const visibleProperties = Object.entries(properties)
        .filter(([key, value]) => {
            const definition = definitionMap.get(key);
            const label = definition?.label ?? key;

            if (normalizedQuery) {
                const searchableValue = value === null || value === undefined ? "" : String(value);
                const haystack = `${key} ${label} ${searchableValue}`.toLowerCase();
                if (!haystack.includes(normalizedQuery)) return false;
            }

            if (showAll) return true;

            // Hide only empty values by default. Legitimate zero values should remain visible.
            if (value === null || value === undefined) return false;
            if (value === "") return false;

            return true;
        })
        .sort(([keyA], [keyB]) => {
            const orderA = orderMap.get(keyA) ?? Number.MAX_SAFE_INTEGER;
            const orderB = orderMap.get(keyB) ?? Number.MAX_SAFE_INTEGER;

            if (orderA !== orderB) return orderA - orderB;
            return keyA.localeCompare(keyB);
        });

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-sm">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Quick search fields"
                        className="pl-9"
                    />
                </div>
                <div className="flex items-center space-x-2">
                    <Switch id="show-all" checked={showAll} onCheckedChange={setShowAll} />
                    <Label htmlFor="show-all">Show all properties</Label>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visibleProperties.length === 0 ? (
                    <div className="col-span-full text-center text-muted-foreground py-8">
                        No visible properties. Toggle &quot;Show all&quot; to see hidden fields.
                    </div>
                ) : (
                    visibleProperties.map(([key, value]) => (
                        <PropertyItem
                            key={key}
                            label={definitionMap.get(key)?.label ?? key}
                            value={value}
                            type={type}
                            id={id}
                            propertyKey={key}
                            propertyDefinition={definitionMap.get(key)}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
