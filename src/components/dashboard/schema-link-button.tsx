import Link from "next/link";
import { Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SCHEMA_OBJECT_TYPES, type SchemaObjectType } from "@/lib/schema-config";

interface SchemaLinkButtonProps {
    objectType: string;
}

export function SchemaLinkButton({ objectType }: SchemaLinkButtonProps) {
    if (!SCHEMA_OBJECT_TYPES.includes(objectType as SchemaObjectType)) {
        return null;
    }

    return (
        <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/schema/${objectType}`}>
                <Database className="h-4 w-4" />
                Schema
            </Link>
        </Button>
    );
}
