"use server";

import { getObjectsByType } from "./common";

export async function getQuotes(limit: number = 100, after?: string, query?: string, searchField?: string) {
    return getObjectsByType("quotes", limit, after, query, ["hs_title"], searchField);
}
