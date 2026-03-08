/**
 * lib/conflictQueryService.ts
 *
 * Defines the specific conflict theaters to monitor and orchestrates
 * staggered API calls to newsdata.io to fetch real news for each.
 *
 * Single Responsibility: query planning and rate-limit-safe fetching.
 */

import {
    NEWSDATA_API_KEY,
    NEWSDATA_BASE_URL,
    COUNTRY_COORDINATES,
    COUNTRY_TO_REGION,
} from "./constants";
import { ArticleDocument } from "./db/schema";
import { NewsDataResponse, NewsArticle } from "@/types";

// ─── Conflict theater definitions ─────────────────────────────────────────────

export interface ConflictQuery {
    /** Machine-readable key (stored in MongoDB as `conflictQuery`) */
    key: string;
    /** Human label for logs */
    label: string;
    /** newsdata.io `q` search parameter */
    searchTerm: string;
    /** Countries to boost (used for geocoding priority) */
    primaryCountries: string[];
    /** newsdata.io country filter codes (optional; comma-separated) */
    countryCodes?: string;
    /** Categories to include */
    categories: string[];
}

/**
 * All active conflict theaters we monitor, in priority order.
 * We stagger API calls with a 1.5 s delay to respect rate limits.
 */
export const CONFLICT_THEATERS: ConflictQuery[] = [
    // ── Middle East: Iran–Israel–US ──────────────────────────────────────────
    {
        key: "iran_israel_war",
        label: "Iran–Israel–US Conflict",
        searchTerm: "Iran Israel war attack missile",
        primaryCountries: ["il", "ir"],
        countryCodes: "il,ir,us",
        categories: ["politics", "world"],
    },
    {
        key: "gaza_conflict",
        label: "Gaza / Palestine Conflict",
        searchTerm: "Gaza Palestine Hamas Israel ceasefire",
        primaryCountries: ["il", "ps"],
        countryCodes: "il,ps,lb",
        categories: ["politics", "world"],
    },
    {
        key: "lebanon_hezbollah",
        label: "Lebanon / Hezbollah",
        searchTerm: "Lebanon Hezbollah Israel airstrike",
        primaryCountries: ["lb"],
        countryCodes: "lb,il",
        categories: ["politics", "world"],
    },
    {
        key: "yemen_houthi",
        label: "Yemen / Houthi",
        searchTerm: "Yemen Houthi attack Red Sea shipping",
        primaryCountries: ["ye"],
        countryCodes: "ye,sa",
        categories: ["politics", "world"],
    },
    {
        key: "syria_conflict",
        label: "Syria",
        searchTerm: "Syria war conflict Assad Damascus",
        primaryCountries: ["sy"],
        countryCodes: "sy",
        categories: ["politics", "world"],
    },
    {
        key: "iraq_violence",
        label: "Iraq",
        searchTerm: "Iraq militia attack explosion Baghdad",
        primaryCountries: ["iq"],
        countryCodes: "iq",
        categories: ["politics", "world"],
    },

    // ── Ukraine–Russia War ──────────────────────────────────────────────────
    {
        key: "ukraine_russia_war",
        label: "Ukraine–Russia War",
        searchTerm: "Ukraine Russia war offensive Kyiv",
        primaryCountries: ["ua", "ru"],
        countryCodes: "ua,ru",
        categories: ["politics", "world"],
    },
    {
        key: "ukraine_frontline",
        label: "Ukraine Eastern Front",
        searchTerm: "Ukraine frontline Zaporizhzhia Kharkiv Bakhmut drone",
        primaryCountries: ["ua"],
        countryCodes: "ua",
        categories: ["politics", "world"],
    },

    // ── Asia ─────────────────────────────────────────────────────────────────
    {
        key: "china_taiwan_tension",
        label: "China–Taiwan Tensions",
        searchTerm: "China Taiwan military drills strait",
        primaryCountries: ["cn", "tw"],
        countryCodes: "cn,tw",
        categories: ["politics", "world"],
    },
    {
        key: "north_korea_missiles",
        label: "North Korea Missiles",
        searchTerm: "North Korea missile launch Kim Jong Un nuclear",
        primaryCountries: ["kp"],
        countryCodes: "kp,kr,jp",
        categories: ["politics", "world"],
    },
    {
        key: "myanmar_civil_war",
        label: "Myanmar Civil War",
        searchTerm: "Myanmar military junta resistance fighting",
        primaryCountries: ["mm"],
        countryCodes: "mm",
        categories: ["politics", "world"],
    },

    // ── Africa ───────────────────────────────────────────────────────────────
    {
        key: "sudan_war",
        label: "Sudan Civil War",
        searchTerm: "Sudan war RSF SAF Khartoum fighting",
        primaryCountries: ["sd"],
        countryCodes: "sd",
        categories: ["politics", "world"],
    },
    {
        key: "sahel_instability",
        label: "Sahel (Mali, Niger, Burkina)",
        searchTerm: "Sahel Mali Niger Burkina coup jihadist",
        primaryCountries: ["ml", "ne", "bf"],
        countryCodes: "ml,ne,bf",
        categories: ["politics", "world"],
    },
    {
        key: "somalia_conflict",
        label: "Somalia / Al-Shabaab",
        searchTerm: "Somalia Al-Shabaab attack Mogadishu",
        primaryCountries: ["so"],
        countryCodes: "so,et,ke",
        categories: ["politics", "world"],
    },
    {
        key: "ethiopia_conflict",
        label: "Ethiopia / Tigray",
        searchTerm: "Ethiopia Tigray Amhara conflict Oromo",
        primaryCountries: ["et"],
        countryCodes: "et",
        categories: ["politics", "world"],
    },
    {
        key: "drc_conflict",
        label: "DRC / Congo M23",
        searchTerm: "Congo DRC M23 Goma fighting eastern",
        primaryCountries: ["cd"],
        countryCodes: "cd",
        categories: ["politics", "world"],
    },
];

// ─── Newsdata.io API fetcher ──────────────────────────────────────────────────

const RATE_LIMIT_DELAY_MS = 1500; // 1.5 s between calls (free plan: ~200 req/day)

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

interface FetchResult {
    query: ConflictQuery;
    articles: NewsArticle[];
    error?: string;
}

/**
 * Fetches news for a single conflict query from newsdata.io.
 */
async function fetchForQuery(query: ConflictQuery): Promise<FetchResult> {
    try {
        const params = new URLSearchParams({
            apikey: NEWSDATA_API_KEY,
            q: query.searchTerm,
            language: "en",
            category: query.categories.join(","),
        });

        if (query.countryCodes) {
            params.set("country", query.countryCodes);
        }

        const url = `${NEWSDATA_BASE_URL}/latest?${params.toString()}`;
        const response = await fetch(url, { cache: "no-store" });

        if (!response.ok) {
            const text = await response.text();
            const errData = JSON.parse(text);
            return {
                query,
                articles: [],
                error: errData?.results?.message ?? `HTTP ${response.status}`,
            };
        }

        const data: NewsDataResponse = await response.json();
        if (data.status !== "success") {
            return {
                query,
                articles: [],
                error: `API status: ${data.status}`,
            };
        }

        return { query, articles: data.results ?? [] };
    } catch (err) {
        return {
            query,
            articles: [],
            error: (err as Error).message,
        };
    }
}

// ─── Conversion ───────────────────────────────────────────────────────────────

/**
 * Country code normalization: newsdata.io uses ISO 2-letter codes,
 * our COUNTRY_COORDINATES map uses full names/keys.
 */
const ISO2_TO_KEY: Record<string, string> = {
    il: "israel",
    ir: "iran",
    ps: "palestine",
    lb: "lebanon",
    ye: "yemen",
    sy: "syria",
    iq: "iraq",
    ua: "ukraine",
    ru: "russia",
    cn: "china",
    tw: "taiwan",
    kp: "north_korea",
    kr: "south_korea",
    jp: "japan",
    mm: "myanmar",
    sd: "sudan",
    ml: "mali",
    ne: "niger",
    bf: "burkina", // mapped to mali coords as fallback
    so: "somalia",
    et: "ethiopia",
    cd: "congo",
    sa: "saudi_arabia",
    us: "usa",
    pk: "pakistan",
    af: "afghanistan",
    in: "india",
    ng: "nigeria",
    ke: "kenya",
    ly: "libya",
};

/**
 * Converts a newsdata.io article + query to an ArticleDocument for MongoDB.
 */
export function toArticleDocument(
    article: NewsArticle,
    query: ConflictQuery
): ArticleDocument {
    const now = new Date();
    // Force countries using query's primaryCountries if article has none
    const rawCountries =
        article.country && article.country.length > 0
            ? article.country
            : query.primaryCountries;

    return {
        article_id: article.article_id,
        title: article.title ?? "(no title)",
        link: article.link ?? "",
        description: article.description ?? null,
        pubDate: article.pubDate ?? now.toISOString(),
        source_name: article.source_name ?? "",
        source_url: article.source_url ?? "",
        country: rawCountries,
        category: article.category ?? query.categories,
        keywords: article.keywords ?? null,
        image_url: article.image_url ?? null,
        conflictQuery: query.key,
        fetchedAt: now,
        ttl: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 h
    };
}

// ─── Geocoding helper (for country codes from newsdata) ──────────────────────

/**
 * Converts a newsdata.io country code array to our geocoding key.
 * Returns all matching keys (primary first).
 */
export function resolveCountryKeys(
    newsdataCountries: string[],
    primaryCountries: string[]
): string[] {
    // Prioritise query's primary countries
    const ordered = [
        ...primaryCountries,
        ...newsdataCountries.filter((c) => !primaryCountries.includes(c)),
    ];

    return ordered
        .map((c) => ISO2_TO_KEY[c.toLowerCase()])
        .filter(Boolean) as string[];
}

// ─── Main orchestrator ────────────────────────────────────────────────────────

export interface SyncResult {
    queriesAttempted: string[];
    queriesSucceeded: string[];
    queriesFailed: string[];
    errors: string[];
    totalArticles: number;
    articlesUpserted: number;
}

/**
 * Fetches news for ALL conflict theaters with rate-limit-safe delays.
 * Returns raw results for the caller to persist.
 */
export async function fetchAllConflictTheaters(): Promise<{
    results: FetchResult[];
    totalFetched: number;
}> {
    const results: FetchResult[] = [];
    let totalFetched = 0;

    for (let i = 0; i < CONFLICT_THEATERS.length; i++) {
        const theater = CONFLICT_THEATERS[i];

        // Add delay between calls (skip before first call)
        if (i > 0) {
            await delay(RATE_LIMIT_DELAY_MS);
        }

        console.log(
            `[Sync] Fetching [${i + 1}/${CONFLICT_THEATERS.length}]: ${theater.label}`
        );
        const result = await fetchForQuery(theater);

        if (result.error) {
            console.warn(`[Sync] Failed ${theater.key}: ${result.error}`);
        } else {
            totalFetched += result.articles.length;
            console.log(
                `[Sync] ${theater.label}: ${result.articles.length} articles`
            );
        }

        results.push(result);
    }

    return { results, totalFetched };
}
