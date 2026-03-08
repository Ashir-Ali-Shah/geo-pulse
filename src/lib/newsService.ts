/**
 * newsService.ts
 *
 * Handles all communication with the newsdata.io API.
 * Single Responsibility: fetch raw news data only.
 */

import { NewsDataResponse } from "@/types";
import { NEWSDATA_API_KEY, NEWSDATA_BASE_URL, CONFLICT_CATEGORIES } from "./constants";

/**
 * Fetches the latest conflict/political news from newsdata.io.
 * Call this from the Next.js API route handler (server-side) to avoid CORS.
 */
export async function fetchConflictNews(
    page?: string
): Promise<NewsDataResponse> {
    const params = new URLSearchParams({
        apikey: NEWSDATA_API_KEY,
        category: CONFLICT_CATEGORIES.join(","),
        language: "en",
        prioritydomain: "top",
    });

    if (page) {
        params.set("page", page);
    }

    const url = `${NEWSDATA_BASE_URL}/latest?${params.toString()}`;

    const response = await fetch(url, {
        next: { revalidate: 300 }, // cache for 5 minutes
        headers: {
            "Accept": "application/json",
        },
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(
            `newsdata.io API error ${response.status}: ${text.slice(0, 200)}`
        );
    }

    const data = await response.json();

    if (data.status !== "success") {
        throw new Error(`newsdata.io returned status: ${data.status}`);
    }

    return data as NewsDataResponse;
}
