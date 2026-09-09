export const SCHEMA_OBJECT_TYPES = ["contacts", "companies", "deals", "products", "line-items", "tickets", "quotes"] as const;

export type SchemaObjectType = (typeof SCHEMA_OBJECT_TYPES)[number];

export const SCHEMA_OBJECT_LABELS: Record<SchemaObjectType, string> = {
    contacts: "Contacts",
    companies: "Companies",
    deals: "Deals",
    products: "Products",
    "line-items": "Line Items",
    tickets: "Tickets",
    quotes: "Quotes",
};

export function getSchemaApiObjectType(objectType: SchemaObjectType) {
    return objectType === "line-items" ? "line_items" : objectType;
}

export const SCHEMA_FIELD_CONFIGS = [
    { value: "string:text", label: "Single-line text", type: "string", fieldType: "text", referencedObjectType: undefined },
    { value: "string:textarea", label: "Multi-line text", type: "string", fieldType: "textarea", referencedObjectType: undefined },
    { value: "number:number", label: "Number", type: "number", fieldType: "number", referencedObjectType: undefined },
    { value: "date:date", label: "Date picker", type: "date", fieldType: "date", referencedObjectType: undefined },
    { value: "datetime:date", label: "Date and time", type: "datetime", fieldType: "date", referencedObjectType: undefined },
    { value: "enumeration:select", label: "Dropdown select", type: "enumeration", fieldType: "select", referencedObjectType: undefined },
    { value: "enumeration:radio", label: "Radio select", type: "enumeration", fieldType: "radio", referencedObjectType: undefined },
    { value: "enumeration:checkbox", label: "Multiple checkboxes", type: "enumeration", fieldType: "checkbox", referencedObjectType: undefined },
    { value: "enumeration:select:OWNER", label: "HubSpot user", type: "enumeration", fieldType: "select", referencedObjectType: "OWNER" },
    { value: "bool:booleancheckbox", label: "Boolean checkbox", type: "bool", fieldType: "booleancheckbox", referencedObjectType: undefined },
] as const;
