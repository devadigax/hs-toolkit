"use server";

import { getAccessToken } from "@/lib/hubspot-server";
import { unstable_cache } from "next/cache";
import { Client } from "@hubspot/api-client";
import { serialize } from "@/lib/utils";
import { hashString } from "@/lib/server-utils";
import type { CustomObjectSchema } from "@/types/hubspot";

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
