"use server";

import { Client } from "@hubspot/api-client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { PRIVATE_TOKEN_COOKIE } from "@/lib/constants";

export async function verifyAndLoginWithToken(formData: FormData) {
    const token = formData.get("token") as string;

    if (!token) {
        return { error: "Token is required" };
    }

    try {
        console.log("Verifying private token...");
        // Validate the token by making a lightweight API call
        // fetching properties is usually safe and fast
        const client = new Client({ accessToken: token });

        // We need to await this to ensure the token is valid before setting the cookie
        await client.crm.properties.coreApi.getAll("contacts");

        console.log("Token verified successfully. Setting cookie...");

        // Set cookie
        const cookieStore = await cookies();
        cookieStore.set(PRIVATE_TOKEN_COOKIE, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: "/",
        });

    } catch (error) {
        console.error("Token verification failed:", error);
        return { error: "Invalid token. Please check and try again." };
    }

    redirect("/dashboard");
}
