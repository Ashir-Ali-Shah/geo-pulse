/**
 * commodityService.ts
 *
 * Provides region-specific commodity data (mocked with realistic data,
 * structured for easy swap-in with a live AlphaVantage / commodity API).
 *
 * Single Responsibility: commodity data retrieval and formatting only.
 */

import { RegionImpact, RegionKey, Commodity } from "@/types";

// ─── Mock commodity data per region ─────────────────────────────────────────

const REGION_COMMODITIES: Record<RegionKey, Commodity[]> = {
    middle_east: [
        {
            name: "Crude Oil (Brent)",
            symbol: "BCO",
            price: 87.42,
            change: 2.14,
            changePercent: 2.51,
            unit: "USD/bbl",
            trend: "up",
        },
        {
            name: "Natural Gas",
            symbol: "NG",
            price: 3.21,
            change: 0.18,
            changePercent: 5.94,
            unit: "USD/MMBtu",
            trend: "up",
        },
        {
            name: "Gold",
            symbol: "XAU",
            price: 2318.5,
            change: 12.3,
            changePercent: 0.53,
            unit: "USD/oz",
            trend: "up",
        },
    ],
    europe: [
        {
            name: "Natural Gas (TTF)",
            symbol: "TTF",
            price: 34.82,
            change: -1.2,
            changePercent: -3.33,
            unit: "EUR/MWh",
            trend: "down",
        },
        {
            name: "Wheat",
            symbol: "ZW",
            price: 612.25,
            change: 8.5,
            changePercent: 1.41,
            unit: "USc/bu",
            trend: "up",
        },
        {
            name: "Palladium",
            symbol: "XPD",
            price: 1024.0,
            change: -5.5,
            changePercent: -0.53,
            unit: "USD/oz",
            trend: "down",
        },
    ],
    east_asia: [
        {
            name: "Copper",
            symbol: "HG",
            price: 4.58,
            change: 0.06,
            changePercent: 1.33,
            unit: "USD/lb",
            trend: "up",
        },
        {
            name: "Iron Ore",
            symbol: "FEF",
            price: 112.4,
            change: -3.2,
            changePercent: -2.77,
            unit: "USD/t",
            trend: "down",
        },
        {
            name: "Semiconductor Index",
            symbol: "SOX",
            price: 4821.0,
            change: -88.0,
            changePercent: -1.79,
            unit: "pts",
            trend: "down",
        },
    ],
    south_asia: [
        {
            name: "Rice",
            symbol: "ZR",
            price: 18.4,
            change: 0.3,
            changePercent: 1.66,
            unit: "USD/cwt",
            trend: "up",
        },
        {
            name: "Cotton",
            symbol: "CT",
            price: 84.52,
            change: -0.72,
            changePercent: -0.84,
            unit: "USc/lb",
            trend: "down",
        },
        {
            name: "Crude Oil (WTI)",
            symbol: "CL",
            price: 83.15,
            change: 1.55,
            changePercent: 1.9,
            unit: "USD/bbl",
            trend: "up",
        },
    ],
    africa: [
        {
            name: "Cocoa",
            symbol: "CC",
            price: 9420.0,
            change: 310.0,
            changePercent: 3.41,
            unit: "USD/t",
            trend: "up",
        },
        {
            name: "Coffee (Arabica)",
            symbol: "KC",
            price: 228.5,
            change: 4.5,
            changePercent: 2.01,
            unit: "USc/lb",
            trend: "up",
        },
        {
            name: "Gold",
            symbol: "XAU",
            price: 2318.5,
            change: 12.3,
            changePercent: 0.53,
            unit: "USD/oz",
            trend: "up",
        },
    ],
    latin_america: [
        {
            name: "Soybeans",
            symbol: "ZS",
            price: 1188.75,
            change: -5.5,
            changePercent: -0.46,
            unit: "USc/bu",
            trend: "down",
        },
        {
            name: "Sugar #11",
            symbol: "SB",
            price: 19.82,
            change: 0.14,
            changePercent: 0.71,
            unit: "USc/lb",
            trend: "up",
        },
        {
            name: "Copper",
            symbol: "HG",
            price: 4.58,
            change: 0.06,
            changePercent: 1.33,
            unit: "USD/lb",
            trend: "up",
        },
    ],
    north_america: [
        {
            name: "Crude Oil (WTI)",
            symbol: "CL",
            price: 83.15,
            change: 1.55,
            changePercent: 1.9,
            unit: "USD/bbl",
            trend: "up",
        },
        {
            name: "Natural Gas",
            symbol: "NG",
            price: 3.21,
            change: 0.18,
            changePercent: 5.94,
            unit: "USD/MMBtu",
            trend: "up",
        },
        {
            name: "Corn",
            symbol: "ZC",
            price: 452.0,
            change: -2.75,
            changePercent: -0.6,
            unit: "USc/bu",
            trend: "down",
        },
    ],
    central_asia: [
        {
            name: "Uranium",
            symbol: "URA",
            price: 91.5,
            change: 0.5,
            changePercent: 0.55,
            unit: "USD/lb",
            trend: "up",
        },
        {
            name: "Crude Oil (Brent)",
            symbol: "BCO",
            price: 87.42,
            change: 2.14,
            changePercent: 2.51,
            unit: "USD/bbl",
            trend: "up",
        },
    ],
    oceania: [
        {
            name: "Iron Ore",
            symbol: "FEF",
            price: 112.4,
            change: -3.2,
            changePercent: -2.77,
            unit: "USD/t",
            trend: "down",
        },
        {
            name: "Coal (Thermal)",
            symbol: "MTF",
            price: 128.0,
            change: -2.5,
            changePercent: -1.91,
            unit: "USD/t",
            trend: "down",
        },
    ],
    unknown: [
        {
            name: "Gold",
            symbol: "XAU",
            price: 2318.5,
            change: 12.3,
            changePercent: 0.53,
            unit: "USD/oz",
            trend: "up",
        },
        {
            name: "Crude Oil (Brent)",
            symbol: "BCO",
            price: 87.42,
            change: 2.14,
            changePercent: 2.51,
            unit: "USD/bbl",
            trend: "up",
        },
    ],
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
            "Regional instability affecting agricultural trade routes. Rice and cotton exports under pressure.",
    },
    africa: {
        riskLevel: "high",
        summary:
            "Sahel instability and coup governance gaps disrupting cocoa and mining exports from West Africa.",
    },
    latin_america: {
        riskLevel: "moderate",
        summary:
            "Political volatility in Venezuela and Mexico affecting soybean, sugar, and commodity export flows.",
    },
    north_america: {
        riskLevel: "low",
        summary: "Domestic markets stable. Energy sector benefiting from elevated oil prices.",
    },
    central_asia: {
        riskLevel: "moderate",
        summary:
            "Geopolitical realignment following Russia sanctions opening new transit corridors, but with risks.",
    },
    oceania: {
        riskLevel: "low",
        summary:
            "Stable, but China trade tensions continue to impact Australian iron ore and coal exports.",
    },
    unknown: {
        riskLevel: "low",
        summary: "Monitoring global commodity indices for systemic risk signals.",
    },
};

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Returns the commodity impact data for a given region.
 * Designed to be easily swapped for a live API call.
 */
export function getRegionImpact(region: RegionKey): RegionImpact {
    const commodities = REGION_COMMODITIES[region] ?? REGION_COMMODITIES.unknown;
    const { riskLevel, summary } = REGION_SUMMARIES[region] ?? REGION_SUMMARIES.unknown;

    return {
        region,
        displayName: getRegionDisplayName(region),
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
