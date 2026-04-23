import { PropertyGrid } from "@/components/dashboard/property-grid";
import { AssociationsList } from "@/components/dashboard/associations-list";
import { getObject, getCustomObjectSchemas } from "@/lib/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getErrorMessage } from "@/lib/utils";
import type { CustomObjectSchema, HubSpotAssociationCollection, HubSpotObject } from "@/types/hubspot";

function renderErrorState(type: string, id: string, message: string) {
    return (
        <div className="p-8 text-red-500">
            <h2 className="text-xl font-bold mb-2">Error loading {type}</h2>
            <p>ID: {id}</p>
            <p className="mt-2">Details: {message}</p>
            <div className="mt-4">
                <Button variant="outline" asChild>
                    <Link href={`/dashboard/${type}`}>Back to List</Link>
                </Button>
            </div>
        </div>
    );
}

export default async function ObjectPage({
    params,
}: {
    params: Promise<{
        type: string;
        id: string;
    }>;
}) {
    const { type, id } = await params;
    let object: HubSpotObject;
    let schemas: CustomObjectSchema[];

    try {
        [object, schemas] = await Promise.all([
            getObject(type, id),
            getCustomObjectSchemas()
        ]) as [HubSpotObject, CustomObjectSchema[]];
    } catch (error: unknown) {
        return renderErrorState(type, id, getErrorMessage(error));
    }

    const properties = object.properties;
    const associations = object.associations as Record<string, HubSpotAssociationCollection> | undefined;

    const schema = schemas.find((item) => item.objectTypeId === type || item.fullyQualifiedName === type);
    let singularLabel = type;
    if (schema) {
        singularLabel = schema.labels.singular;
    } else {
        const singularMap: Record<string, string> = {
            contacts: "Contact",
            companies: "Company",
            deals: "Deal",
            tickets: "Ticket",
            products: "Product",
            quotes: "Quote",
            "line-items": "Line Item",
        };
        singularLabel = singularMap[type] || type;
    }

    return (
        <div className="flex-1 space-y-4">
            <div className="flex items-center space-x-2 mb-4">
                <Button variant="ghost" size="sm" asChild>
                    <Link href={`/dashboard/${type}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to {schema ? schema.labels.plural : type}
                    </Link>
                </Button>
            </div>
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight capitalize">
                    {singularLabel} Details
                </h2>
            </div>
            <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>Properties</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <PropertyGrid properties={properties} type={type} id={id} />
                    </CardContent>
                </Card>

                <div className="col-span-1">
                    <AssociationsList associations={associations} />
                </div>
            </div>
        </div>
    );
}
