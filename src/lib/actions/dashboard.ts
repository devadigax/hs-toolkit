"use server";

import { getAccessToken } from "@/lib/hubspot-server";
import { unstable_cache, updateTag } from "next/cache";
import { Client } from "@hubspot/api-client";
import { cookies } from "next/headers";
import { REFRESH_TOKEN_COOKIE, COOKIE_NAME, EXPIRES_IN_COOKIE, PRIVATE_TOKEN_COOKIE, OAUTH_STATE_COOKIE } from "@/lib/constants";
import { serialize } from "@/lib/utils";
import { hashString } from "@/lib/server-utils";
import type { AccountDetails, ApiUsageResponse, DashboardStats } from "@/types/hubspot";

export async function getDashboardStats() {
    const accessToken = await getAccessToken();

    return unstable_cache(async (token: string) => {
        const hubspotClient = new Client({ accessToken: token });
        const searchRequest = {
            limit: 1,
            filterGroups: [],
        };

        const contactsCount = await hubspotClient.crm.contacts.searchApi.doSearch(searchRequest).then((response) => response.total).catch(() => 0);
        const companiesCount = await hubspotClient.crm.companies.searchApi.doSearch(searchRequest).then((response) => response.total).catch(() => 0);
        const dealsCount = await hubspotClient.crm.deals.searchApi.doSearch(searchRequest).then((response) => response.total).catch(() => 0);
        const ticketsCount = await hubspotClient.crm.tickets.searchApi.doSearch(searchRequest).then((response) => response.total).catch(() => 0);
        const productsCount = await hubspotClient.crm.products.searchApi.doSearch(searchRequest).then((response) => response.total).catch(() => 0);

        return {
            counts: {
                contacts: contactsCount,
                companies: companiesCount,
                deals: dealsCount,
                tickets: ticketsCount,
                products: productsCount,
            }
        } satisfies DashboardStats;
    }, ['dashboard-stats', hashString(accessToken)], { tags: ['dashboard'] })(accessToken);
}

export async function getAccountDetails() {
    const accessToken = await getAccessToken();

    return unstable_cache(async (token: string) => {
        const hubspotClient = new Client({ accessToken: token });
        try {
            const response = await hubspotClient.apiRequest({
                method: 'GET',
                path: '/account-info/v3/details',
            });
            const json = await response.json();
            return serialize(json as AccountDetails);
        } catch (e) {
            console.error("Error fetching account details:", e);
            return null;
        }
    }, ['account-details', hashString(accessToken)], { tags: ['dashboard'] })(accessToken);
}

export async function getDailyApiUsage() {
    const accessToken = await getAccessToken();

    return unstable_cache(async (token: string) => {
        const hubspotClient = new Client({ accessToken: token });
        try {
            const response = await hubspotClient.apiRequest({
                method: 'GET',
                path: '/account-info/v3/api-usage/daily/private-apps',
            });
            const json = await response.json();
            return serialize(json as ApiUsageResponse);
        } catch (e) {
            console.error("Error fetching daily API usage:", e);
            return null;
        }
    }, ['daily-api-usage', hashString(accessToken)], { tags: ['dashboard'] })(accessToken);
}

export async function refreshDashboard() {
    updateTag('dashboard');
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete(REFRESH_TOKEN_COOKIE);
    cookieStore.delete(COOKIE_NAME);
    cookieStore.delete(EXPIRES_IN_COOKIE);
    cookieStore.delete(PRIVATE_TOKEN_COOKIE);
    cookieStore.delete(OAUTH_STATE_COOKIE);
}
