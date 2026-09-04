"use server";

import { getAccessToken } from "@/lib/hubspot-server";
import { revalidatePath, unstable_cache, updateTag } from "next/cache";
import { Client } from "@hubspot/api-client";
import { getErrorMessage, serialize } from "@/lib/utils";
import { hashString } from "@/lib/server-utils";
import { SCHEMA_FIELD_CONFIGS, SCHEMA_OBJECT_TYPES, type SchemaObjectType } from "@/lib/schema-config";
import type { CustomObjectSchema, HubSpotPropertyDefinition, HubSpotPropertyOption, SchemaPropertyUpdateInput } from "@/types/hubspot";

type PropertiesResponse = {
    results: HubSpotPropertyDefinition[];
};

const ENUMERATION_FIELD_TYPES = new Set(["select", "radio", "checkbox"]);
const SCHEMA_FIELD_CONFIG_VALUES = new Set<string>(SCHEMA_FIELD_CONFIGS.map((config) => config.value));

function assertSchemaObjectType(objectType: string): asserts objectType is SchemaObjectType {
    if (!SCHEMA_OBJECT_TYPES.includes(objectType as SchemaObjectType)) {
        throw new Error(`Unsupported schema object type: ${objectType}`);
    }
}

function slugifyOptionValue(label: string) {
    const slug = label
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");

    return slug || `option_${Date.now()}`;
}

function normalizeOptions(options: HubSpotPropertyOption[]) {
    const seen = new Map<string, number>();

    return options
        .map((option) => ({
            ...option,
            label: option.label.trim(),
            value: option.value.trim() || slugifyOptionValue(option.label),
            hidden: Boolean(option.hidden),
        }))
        .filter((option) => option.label.length > 0)
        .map((option, index) => {
            const baseValue = option.value || slugifyOptionValue(option.label);
            const count = seen.get(baseValue) ?? 0;
            seen.set(baseValue, count + 1);

            return {
                hidden: option.hidden,
                displayOrder: index,
                description: option.description?.trim() || "",
                label: option.label,
                value: count === 0 ? baseValue : `${baseValue}_${count + 1}`,
            };
        });
}

export async function getCustomObjectSchemas() {
    const accessToken = await getAccessToken();

    return unstable_cache(
        async (token: string) => {
            const hubspotClient = new Client({ accessToken: token });
            try {
                const response = await hubspotClient.crm.schemas.coreApi.getAll();
                return serialize(response.results as CustomObjectSchema[]);
            } catch (e: unknown) {
                console.error("Error fetching custom object schemas:", e instanceof Error ? e.message : e);
                return [];
            }
        },
        ["custom-object-schemas", hashString(accessToken)],
        {
            tags: ["custom-objects"],
            revalidate: 3600, // Cache for 1 hour, or tag invalidation
        }
    )(accessToken);
}

export async function getSchemaProperties(objectType: string) {
    assertSchemaObjectType(objectType);
    const accessToken = await getAccessToken();

    return unstable_cache(
        async (token: string, type: SchemaObjectType) => {
            const hubspotClient = new Client({ accessToken: token });
            try {
                const response = await hubspotClient.crm.properties.coreApi.getAll(type, false);
                const properties = serialize((response as PropertiesResponse).results);

                return properties.sort((a, b) => {
                    const aOrder = a.displayOrder ?? Number.MAX_SAFE_INTEGER;
                    const bOrder = b.displayOrder ?? Number.MAX_SAFE_INTEGER;

                    if (a.groupName !== b.groupName) return a.groupName.localeCompare(b.groupName);
                    if (aOrder !== bOrder) return aOrder - bOrder;

                    return a.label.localeCompare(b.label);
                });
            } catch (e: unknown) {
                console.error(`Error fetching ${type} schema properties:`, e instanceof Error ? e.message : e);
                throw e;
            }
        },
        ["schema-properties", objectType, hashString(accessToken)],
        {
            tags: [`schema-properties-${objectType}`],
            revalidate: 3600,
        }
    )(accessToken, objectType);
}

export async function updateSchemaProperty(objectType: string, propertyName: string, input: SchemaPropertyUpdateInput) {
    assertSchemaObjectType(objectType);

    if (!propertyName.trim()) {
        return { success: false, error: "Property name is required." };
    }

    if (!SCHEMA_FIELD_CONFIG_VALUES.has(`${input.type}:${input.fieldType}`)) {
        return { success: false, error: "Unsupported property type selected." };
    }

    try {
        const hubspotClient = new Client({ accessToken: await getAccessToken() });
        const existingProperty = serialize(
            await hubspotClient.crm.properties.coreApi.getByName(objectType, propertyName, false)
        ) as HubSpotPropertyDefinition;

        if (existingProperty.modificationMetadata?.readOnlyDefinition) {
            return { success: false, error: "HubSpot marks this property definition as read-only." };
        }

        const isEnumeration = input.type === "enumeration" || ENUMERATION_FIELD_TYPES.has(input.fieldType);
        const areOptionsReadOnly = Boolean(existingProperty.modificationMetadata?.readOnlyOptions || existingProperty.externalOptions);
        const normalizedOptions = isEnumeration
            ? areOptionsReadOnly
                ? normalizeOptions(existingProperty.options ?? [])
                : normalizeOptions(input.options)
            : [];

        if (isEnumeration && normalizedOptions.length === 0) {
            return { success: false, error: "Dropdown, radio, and checkbox properties need at least one option." };
        }

        const propertyUpdate = {
            label: input.label.trim() || propertyName,
            description: input.description.trim(),
            type: input.type,
            fieldType: input.fieldType,
            hidden: Boolean(input.hidden),
            formField: Boolean(input.formField),
            ...(isEnumeration ? { options: normalizedOptions } : {}),
        };

        const response = await hubspotClient.crm.properties.coreApi.update(
            objectType,
            propertyName,
            propertyUpdate as Parameters<typeof hubspotClient.crm.properties.coreApi.update>[2]
        );

        updateTag(`schema-properties-${objectType}`);
        updateTag("properties");
        revalidatePath(`/dashboard/schema/${objectType}`);

        return { success: true, data: serialize(response as HubSpotPropertyDefinition) };
    } catch (error: unknown) {
        console.error(`Error updating ${objectType} property ${propertyName}:`, error);
        return { success: false, error: getErrorMessage(error) };
    }
}
