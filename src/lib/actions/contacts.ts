"use server";

import { getObjectsByType } from "./common";

export async function getContacts(limit: number = 100, after?: string, query?: string, searchField?: string) {
    return getObjectsByType("contacts", limit, after, query, ["firstname", "lastname", "email"], searchField);
}
