/**
 * dataProcessor.ts
 *
 * Core scoring engine: fetches news data and computes conflict scores,
 * geocodes events, applies color logic, and identifies pulsing hotspots.
 *
 * Follows Single Responsibility Principle — each function does one job.
 */

import {
    NewsArticle,
    ConflictEvent,
    ConflictColor,
    GlobalStats,
    RegionKey,
} from "@/types";
import {
    COLOR_THRESHOLDS,
    COUNTRY_COORDINATES,
    COUNTRY_TO_REGION,
    CREDIBLE_SOURCES,
    PULSE_Z_SCORE_THRESHOLD,
} from "./constants";

// ─── Keyword-based conflict scoring ──────────────────────────────────────────

// High conflict / instability terms → push toward -10 (conflict)
const CONFLICT_KEYWORDS = new Set([
    "war", "attack", "bomb", "missile", "killed", "airstrike", "explosion",
    "conflict", "battle", "siege", "massacre", "invasion", "military",
    "troops", "weapons", "strike", "offensive", "shelling", "gunfire",
    "terrorist", "terrorism", "coup", "protest", "riot", "unrest", "crisis",
    "sanctions", "blockade", "refugees", "casualties", "wounded", "dead",
    "fighting", "clash", "insurgency", "ceasefire", "hostage", "violence",
    "atrocity", "genocide", "displacement", "evacuation", "casualties",
    "nuclear", "threat", "escalation", "tension",
]);

// Stability / peace terms → push toward +10 (stability)
const STABILITY_KEYWORDS = new Set([
    "peace", "agreement", "treaty", "ceasefire", "deal", "negotiations",
    "diplomacy", "aid", "relief", "reconstruction", "cooperation", "summit",
    "talks", "resolution", "truce",
]);

/**
 * Scores a single article title + keywords using conflict vocabulary.
 * Returns a Goldstein-like value: -10 (max conflict) to +10 (max stability).
 */
function articleToGoldstein(article: NewsArticle): number {
    const text = [
        article.title ?? "",
        ...(article.keywords ?? []),
        article.description ?? "",
    ]
        .join(" ")
        .toLowerCase();

    let score = 0;

    // Each conflict keyword hit pushes -1.5, capped
    for (const kw of CONFLICT_KEYWORDS) {
        if (text.includes(kw)) score -= 1.5;
    }

    // Each stability keyword hit pushes +1.5
    for (const kw of STABILITY_KEYWORDS) {
        if (text.includes(kw)) score += 1.5;
    }

    // Categories boost (politics/crime → slightly negative baseline)
    const categories = article.category ?? [];
    if (categories.includes("crime")) score -= 1;
    if (categories.includes("politics")) score -= 0.5;

    return Math.max(-10, Math.min(10, score));
}


/**
 * Converts a Goldstein-scale value (-10 to +10) to a 0–100 conflict score.
 * -10 → 100 (maximum conflict), +10 → 0 (maximum stability).
 */
export function goldsteinToConflictScore(goldstein: number): number {
    const clamped = Math.max(-10, Math.min(10, goldstein));
    return Math.round(((clamped * -1 + 10) / 20) * 100);
}

/**
 * Determines the conflict color for a given score.
 */
export function scoreToColor(score: number): ConflictColor {
    if (score >= COLOR_THRESHOLDS.RED_MIN) return "red";
    if (score >= COLOR_THRESHOLDS.AMBER_MIN) return "amber";
    return "green";
}

// ─── Geocoding ───────────────────────────────────────────────────────────────

/**
 * Attempts to find coordinates for a list of country codes.
 * Returns the first match, or null if none found.
 */
export function resolveCoordinates(
    countries: string[]
): [number, number] | null {
    for (const code of countries) {
        const normalised = code.toLowerCase().replace(/[-\s]/g, "_");
        const coords = COUNTRY_COORDINATES[normalised];
        if (coords) return coords;
    }
    return null;
}

/**
 * Resolves a region key from a list of country codes.
 */
export function resolveRegion(countries: string[]): RegionKey {
    for (const code of countries) {
        const normalised = code.toLowerCase().replace(/[-\s]/g, "_");
        const region = COUNTRY_TO_REGION[normalised];
        if (region) return region;
    }
    return "unknown";
}

// ─── Credibility Filter ──────────────────────────────────────────────────────

/**
 * Returns true if the article's source domain is in the credibility whitelist.
 */
export function isCredibleSource(sourceUrl: string): boolean {
    try {
        const hostname = new URL(
            sourceUrl.startsWith("http") ? sourceUrl : `https://${sourceUrl}`
        ).hostname.replace(/^www\./, "");
        return CREDIBLE_SOURCES.has(hostname);
    } catch {
        return false;
    }
}

// ─── Statistics ──────────────────────────────────────────────────────────────

/**
 * Computes mean and standard deviation for an array of numbers.
 */
function computeStats(values: number[]): { mean: number; std: number } {
    if (values.length === 0) return { mean: 0, std: 0 };
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance =
        values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / values.length;
    return { mean, std: Math.sqrt(variance) };
}

/**
 * Computes whether a point's mention count is above the Z-score threshold.
 */
export function computeZScore(
    value: number,
    mean: number,
    std: number
): number {
    if (std === 0) return 0;
    return (value - mean) / std;
}

// ─── Aggregation ─────────────────────────────────────────────────────────────

/**
 * Groups raw articles into ConflictEvent objects, one per country.
 * Computes conflict scores, colors, and pulsing state.
 */
export function aggregateArticlesToEvents(
    articles: NewsArticle[]
): ConflictEvent[] {
    // Group by country (take first country code as primary)
    const groups = new Map<string, NewsArticle[]>();

    for (const article of articles) {
        const countries = article.country ?? [];
        if (countries.length === 0) continue;

        const primary = countries[0].toLowerCase();
        const coords = resolveCoordinates(countries);
        if (!coords) continue; // skip if we can't geocode

        const existing = groups.get(primary) ?? [];
        existing.push(article);
        groups.set(primary, existing);
    }

    // First pass: compute mention counts for Z-score calculation
    const mentionCounts = Array.from(groups.values()).map((g) => g.length);
    const { mean, std } = computeStats(mentionCounts);

    const events: ConflictEvent[] = [];

    for (const [countryKey, countryArticles] of groups.entries()) {
        const countries = countryArticles[0].country!;
        const coords = resolveCoordinates(countries)!;
        const region = resolveRegion(countries);

        // Average Goldstein score across all articles in group
        const goldsteinValues = countryArticles.map((a) => articleToGoldstein(a));
        const avgGoldstein =
            goldsteinValues.reduce((a: number, b: number) => a + b, 0) / goldsteinValues.length;

        const conflictScore = goldsteinToConflictScore(avgGoldstein);
        const color = scoreToColor(conflictScore);
        const mentionCount = countryArticles.length;
        const zScore = computeZScore(mentionCount, mean, std);
        const isPulsing = zScore >= PULSE_Z_SCORE_THRESHOLD;

        // Extract top keywords
        const keywordFreq = new Map<string, number>();
        for (const a of countryArticles) {
            for (const kw of a.keywords ?? []) {
                keywordFreq.set(kw, (keywordFreq.get(kw) ?? 0) + 1);
            }
        }
        const topKeywords = Array.from(keywordFreq.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([kw]) => kw);

        events.push({
            id: `${countryKey}-${Date.now()}`,
            lat: coords[0],
            lng: coords[1],
            country: countryKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            region,
            conflictScore,
            color,
            mentionCount,
            isPulsing,
            articles: countryArticles,
            topKeywords,
        });
    }

    return events;
}

// ─── Global Stats ────────────────────────────────────────────────────────────

export function computeGlobalStats(
    events: ConflictEvent[],
    totalArticles: number
): GlobalStats {
    const mentionCounts = events.map((e) => e.mentionCount);
    const { mean, std } = computeStats(mentionCounts);

    return {
        totalEvents: events.length,
        criticalZones: events.filter((e) => e.color === "red").length,
        totalArticles,
        highestConflictScore: Math.max(...events.map((e) => e.conflictScore), 0),
        meanMentionCount: Math.round(mean),
        stdDevMentionCount: Math.round(std),
    };
}
