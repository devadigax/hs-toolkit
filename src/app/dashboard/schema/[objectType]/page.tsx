import Link from "next/link";
import { notFound } from "next/navigation";
import { SchemaPropertiesTable } from "@/components/dashboard/schema-properties-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getSchemaProperties } from "@/lib/actions";
import { SCHEMA_OBJECT_TYPES } from "@/lib/schema-config";
import { cn, getErrorMessage } from "@/lib/utils";
import type { HubSpotPropertyDefinition } from "@/types/hubspot";

const OBJECT_LABELS: Record<string, string> = {
    contacts: "Contacts",
    companies: "Companies",
    deals: "Deals",
};

export default async function ObjectSchemaPage({
    params,
}: {
    params: Promise<{
        objectType: string;
    }>;
}) {
    const { objectType } = await params;

    if (!SCHEMA_OBJECT_TYPES.includes(objectType as (typeof SCHEMA_OBJECT_TYPES)[number])) {
        notFound();
    }

    let properties: HubSpotPropertyDefinition[] = [];
    let errorMessage = "";

    try {
        properties = await getSchemaProperties(objectType);
    } catch (error: unknown) {
        errorMessage = getErrorMessage(error);
    }

    if (errorMessage) {
        if (errorMessage.includes("No value for refresh token found")) {
            return (
                <div className="flex flex-col items-center justify-center p-8 text-center text-red-500">
                    <p>Authentication Failed. please login again.</p>
                    <div className="mt-4">
                        <a href="/api/auth/login" className="text-blue-500 hover:underline">Login with HubSpot</a>
                    </div>
                </div>
            );
        }

        return (
            <div className="p-8 text-red-500">
                Error loading {objectType} schema: {errorMessage}
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <h2 className="text-3xl font-bold tracking-tight">{OBJECT_LABELS[objectType]} Schema</h2>
                <div className="flex flex-wrap items-center gap-2">
                    {SCHEMA_OBJECT_TYPES.map((type) => (
                        <Button
                            key={type}
                            asChild
                            variant={type === objectType ? "default" : "outline"}
                            size="sm"
                            className={cn(type === objectType && "pointer-events-none")}
                        >
                            <Link href={`/dashboard/schema/${type}`}>{OBJECT_LABELS[type]}</Link>
                        </Button>
                    ))}
                </div>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <SchemaPropertiesTable objectType={objectType} properties={properties} />
                </CardContent>
            </Card>
        </div>
    );
}
