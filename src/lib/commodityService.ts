/**
 * commodityService.ts
 *
 * Provides real-time commodity data using the Twelve Data API (via ETF proxies).
 * Automatically caches responses to respect the 800 calls/day free tier limit.
 */

import { RegionImpact, RegionKey, Commodity } from "@/types";

// ─── ETF Proxy Mappings for Commodities ───────────────────────────────────────
// We use highly liquid ETFs as proxies because live commodity spot/futures
// data is typically restricted on free financial API tiers.
const SYMBOL_MAP: Record<string, { name: string; unit: string }> = {
    USO: { name: "Crude Oil (WTI)", unit: "USD" },
    UNG: { name: "Natural Gas", unit: "USD" },
    GLD: { name: "Gold", unit: "USD" },
    WEAT: { name: "Wheat", unit: "USD" },
    CORN: { name: "Corn", unit: "USD" },
    SOXX: { name: "Semiconductors", unit: "USD" },
    COPX: { name: "Copper Miners", unit: "USD" },
    URA: { name: "Uranium", unit: "USD" },
};

// ─── Region to Asset Mapping ──────────────────────────────────────────────────
const REGION_ASSETS: Record<RegionKey, string[]> = {
    middle_east: ["USO", "UNG", "GLD"],
    europe: ["WEAT", "UNG", "SOXX"],
    east_asia: ["SOXX", "GLD", "COPX"],
    south_asia: ["WEAT", "USO", "CORN"],
    africa: ["URA", "GLD", "USO"],
    latin_america: ["CORN", "WEAT", "COPX"],
    north_america: ["USO", "UNG", "CORN"],
    central_asia: ["URA", "GLD", "USO"],
    oceania: ["COPX", "UNG", "GLD"],
    unknown: ["USO", "GLD", "WEAT"],
};

// ─── Risk summaries per region ───────────────────────────────────────────────
const REGION_SUMMARIES: Record<
    RegionKey,
    { riskLevel: RegionImpact["riskLevel"]; summary: string }
> = {
    middle_east: {
        riskLevel: "critical",
        summary:
            "Active conflict disrupting oil supply routes. Strait of Hormuz under elevated threat; energy markets highly volatile.",
    },
    europe: {
        riskLevel: "high",
        summary:
            "Ongoing Ukraine conflict stressing gas supply and food exports. NATO escalation risk remains elevated.",
    },
    east_asia: {
        riskLevel: "high",
        summary:
            "Taiwan Strait tensions impacting semiconductor supply chains and regional trade flows.",
    },
    south_asia: {
        riskLevel: "moderate",
        summary:
            "Regional instability affecting agricultural trade routes. Grain exports under pressure.",
    },
    africa: {
        riskLevel: "high",
        summary:
            "Sahel instability and domestic conflicts disrupting agricultural and mining exports.",
    },
    latin_america: {
        riskLevel: "moderate",
        summary:
            "Political volatility affecting agricultural yields and copper mining output.",
    },
    north_america: {
        riskLevel: "low",
        summary: "Domestic markets stable. Energy sector absorbing global supply shocks.",
    },
    central_asia: {
        riskLevel: "moderate",
        summary:
            "Geopolitical realignment and sanctions shifting energy and uranium transit corridors.",
    },
    oceania: {
        riskLevel: "low",
        summary:
            "Stable, but global trade tensions continue to impact mining exports.",
    },
    unknown: {
        riskLevel: "low",
        summary: "Monitoring global commodity indices for systemic risk signals.",
    },
};

// ─── Live Data Fetching ───────────────────────────────────────────────────────

/**
 * Fetches real-time price data from Twelve Data.
 * Uses Next.js data caching (revalidate: 3600 seconds / 60 mins) to stay well
 * within the 800 req/day limit for the API.
 */
async function fetchTwelveDataQuotes(symbols: string[]): Promise<Commodity[]> {
    const apiKey = process.env.TWELVE_DATA_API_KEY;
    if (!apiKey) {
        console.warn("TWELVE_DATA_API_KEY is not set. Returning empty commodities.");
        return [];
    }

    const symbolList = symbols.join(",");
    // We request time_series with outputsize=2 to get the latest close and the previous close
    // to calculate the accurate daily % change.
    const url = `https://api.twelvedata.com/time_series?symbol=${symbolList}&interval=1day&outputsize=2&apikey=${apiKey}`;

    const res = await fetch(url, { next: { revalidate: 3600 } });

    if (!res.ok) {
        console.error("Failed to fetch from Twelve Data:", res.status);
        return [];
    }

    const data = await res.json();
    const commodities: Commodity[] = [];

    // Twelve Data single vs multiple symbols response format:
    // If multiple symbols: data = { "AAPL": { values: [...] }, "MSFT": { ... } }
    // If single symbol: data = { meta: {...}, values: [...] }

    const isSingleSymbol = symbols.length === 1;
    const items = isSingleSymbol ? { [symbols[0]]: data } : data;

    for (const symbol of symbols) {
        const item = items[symbol];
        if (item?.status === "ok" && item.values && item.values.length >= 2) {
            const currentClose = parseFloat(item.values[0].close);
            const prevClose = parseFloat(item.values[1].close);
            const change = currentClose - prevClose;
            const changePercent = (change / prevClose) * 100;

            let trend: "up" | "down" | "flat" = "flat";
            if (change > 0) trend = "up";
            if (change < 0) trend = "down";

            const metaInfo = SYMBOL_MAP[symbol];

            commodities.push({
                name: metaInfo?.name ?? symbol,
                symbol,
                price: currentClose,
                change,
                changePercent,
                unit: metaInfo?.unit ?? "USD",
                trend,
            });
        }
    }

    return commodities;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Returns the live commodity impact data for a given region.
 */
export async function getRegionImpact(region: RegionKey): Promise<RegionImpact> {
    const defaultRegion = REGION_ASSETS[region] ? region : "unknown";
    const symbols = REGION_ASSETS[defaultRegion];
    const { riskLevel, summary } = REGION_SUMMARIES[defaultRegion];

    const commodities = await fetchTwelveDataQuotes(symbols);

    return {
        region: defaultRegion,
        displayName: getRegionDisplayName(defaultRegion),
        commodities,
        riskLevel,
        summary,
    };
}

function getRegionDisplayName(region: RegionKey): string {
    const names: Record<RegionKey, string> = {
        middle_east: "Middle East",
        europe: "Europe",
        east_asia: "East Asia",
        south_asia: "South Asia",
        africa: "Sub-Saharan Africa",
        latin_america: "Latin America",
        north_america: "North America",
        central_asia: "Central Asia",
        oceania: "Oceania",
        unknown: "Global",
    };
    return names[region] ?? "Global";
}
