"use server";

import { getObjectsByType } from "./common";

export async function getCompanies(limit: number = 100, after?: string, query?: string) {
    return getObjectsByType("companies", limit, after, query, ["name", "domain"]);
}
