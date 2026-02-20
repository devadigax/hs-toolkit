"use server";

import { getObjectsByType } from "./common";

export async function getTickets(limit: number = 100, after?: string, query?: string, searchField?: string) {
    return getObjectsByType("tickets", limit, after, query, ["subject"], searchField);
}
