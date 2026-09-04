export const SCHEMA_OBJECT_TYPES = ["contacts", "companies", "deals"] as const;

export type SchemaObjectType = (typeof SCHEMA_OBJECT_TYPES)[number];

export const SCHEMA_FIELD_CONFIGS = [
    { value: "string:text", label: "Single-line text", type: "string", fieldType: "text" },
    { value: "string:textarea", label: "Multi-line text", type: "string", fieldType: "textarea" },
    { value: "number:number", label: "Number", type: "number", fieldType: "number" },
    { value: "date:date", label: "Date picker", type: "date", fieldType: "date" },
    { value: "datetime:date", label: "Date and time", type: "datetime", fieldType: "date" },
    { value: "enumeration:select", label: "Dropdown select", type: "enumeration", fieldType: "select" },
    { value: "enumeration:radio", label: "Radio select", type: "enumeration", fieldType: "radio" },
    { value: "enumeration:checkbox", label: "Multiple checkboxes", type: "enumeration", fieldType: "checkbox" },
    { value: "bool:booleancheckbox", label: "Boolean checkbox", type: "bool", fieldType: "booleancheckbox" },
] as const;
