"use server";

import { getObjectsByType } from "./common";

export async function getTickets(limit: number = 100, after?: string) {
    return getObjectsByType("tickets", limit, after, undefined);
}
