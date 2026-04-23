"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PropertyItem } from "@/components/dashboard/property-item";

interface PropertyGridProps {
    properties: Record<string, string | number | boolean | null | undefined>;
    type: string;
    id: string;
}

export function PropertyGrid({ properties, type, id }: PropertyGridProps) {
    const [showAll, setShowAll] = useState(false);

    const visibleProperties = Object.entries(properties).filter(([, value]) => {
        if (showAll) return true;

        // Hide only empty values by default. Legitimate zero values should remain visible.
        if (value === null || value === undefined) return false;
        if (value === "") return false;

        return true;
    });

    return (
        <div className="space-y-4">
            <div className="flex items-center space-x-2 justify-end">
                <Switch id="show-all" checked={showAll} onCheckedChange={setShowAll} />
                <Label htmlFor="show-all">Show all properties</Label>
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
                            label={key}
                            value={value as string}
                            type={type}
                            id={id}
                            propertyKey={key}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
