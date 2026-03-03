"use server";

import { getHubSpotClient, getAccessToken } from "@/lib/hubspot-server";
import { unstable_cache, updateTag } from "next/cache";
import { Client } from "@hubspot/api-client";
import { cookies } from "next/headers";
import { REFRESH_TOKEN_COOKIE, COOKIE_NAME, EXPIRES_IN_COOKIE } from "@/lib/constants";
import { serialize } from "@/lib/utils";
import { hashString } from "@/lib/server-utils";

export async function getDashboardStats() {
    const accessToken = await getAccessToken();

    return unstable_cache(async (token: string) => {
        const hubspotClient = new Client({ accessToken: token });

        const getCount = async (api: any) => {
            const searchRequest = {
                limit: 1,
                filterGroups: [],
            };
            const response = await api.doSearch(searchRequest);
            return response.total;
        };

        const contactsCount = await getCount(hubspotClient.crm.contacts.searchApi).catch(() => 0);
        const companiesCount = await getCount(hubspotClient.crm.companies.searchApi).catch(() => 0);
        const dealsCount = await getCount(hubspotClient.crm.deals.searchApi).catch(() => 0);
        const ticketsCount = await getCount(hubspotClient.crm.tickets.searchApi).catch(() => 0);
        const productsCount = await getCount(hubspotClient.crm.products.searchApi).catch(() => 0);

        return {
            counts: {
                contacts: contactsCount,
                companies: companiesCount,
                deals: dealsCount,
                tickets: ticketsCount,
                products: productsCount,
            }
        };
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
            return serialize(json);
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
            return serialize(json);
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
}
