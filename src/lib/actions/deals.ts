"use server";

import { getObjectsByType } from "./common";

export async function getDeals(limit: number = 100, after?: string, query?: string, searchField?: string) {
    return getObjectsByType("deals", limit, after, query, ["dealname"], searchField);
}
