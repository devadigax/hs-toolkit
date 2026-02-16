"use server";

import { getObjectsByType } from "./common";

export async function getQuotes(limit: number = 100, after?: string) {
    return getObjectsByType("quotes", limit, after, undefined);
}
