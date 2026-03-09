/**
 * lib/zoneComputer.ts
 *
 * Computes ConflictZoneDocument objects from raw ArticleDocuments stored in MongoDB.
 * Uses the same scoring engine as dataProcessor.ts but operates on persisted data.
 *
 * Single Responsibility: zone aggregation and scoring pipeline.
 */

import { ArticleDocument, ConflictZoneDocument } from "./db/schema";
import {
    goldsteinToConflictScore,
    scoreToColor,
    computeZScore,
    resolveCoordinates,
    resolveRegion,
} from "./dataProcessor";
import {
    COUNTRY_COORDINATES,
    COUNTRY_TO_REGION,
    PULSE_Z_SCORE_THRESHOLD,
} from "./constants";
import { resolveCountryKeys, CONFLICT_THEATERS } from "./conflictQueryService";

// ─── Keyword scoring (mirrors dataProcessor.ts) ────────────────────────────────

const CONFLICT_KEYWORDS = new Set([
    "war", "attack", "bomb", "missile", "killed", "airstrike", "explosion",
    "conflict", "battle", "siege", "massacre", "invasion", "military",
    "troops", "weapons", "strike", "offensive", "shelling", "gunfire",
    "terrorist", "terrorism", "coup", "protest", "riot", "unrest", "crisis",
    "sanctions", "blockade", "refugees", "casualties", "wounded", "dead",
    "fighting", "clash", "insurgency", "ceasefire", "hostage", "violence",
    "atrocity", "genocide", "displacement", "evacuation", "nuclear",
    "threat", "escalation", "tension", "rocket", "drone", "raid", "assault",
    "gunmen", "ambush", "captured", "offensive", "combat", "warzone",
]);

const STABILITY_KEYWORDS = new Set([
    "peace", "agreement", "treaty", "deal", "negotiations", "diplomacy",
    "aid", "relief", "reconstruction", "cooperation", "summit", "talks",
    "resolution", "truce",
]);

function articleToGoldstein(article: ArticleDocument): number {
    const text = [
        article.title ?? "",
        ...(article.keywords ?? []),
        article.description ?? "",
    ]
        .join(" ")
        .toLowerCase();

    let score = 0;

    for (const kw of CONFLICT_KEYWORDS) {
        if (text.includes(kw)) score -= 1.5;
    }
    for (const kw of STABILITY_KEYWORDS) {
        if (text.includes(kw)) score += 1.5;
    }

    const categories = article.category ?? [];
    if (categories.includes("crime")) score -= 1;
    if (categories.includes("politics")) score -= 0.5;

    return Math.max(-10, Math.min(10, score));
}

// ─── Mean / Std helpers ───────────────────────────────────────────────────────

function computeMeanStd(values: number[]): { mean: number; std: number } {
    if (values.length === 0) return { mean: 0, std: 0 };
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance =
        values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / values.length;
    return { mean, std: Math.sqrt(variance) };
}

// ─── Country key → display name ───────────────────────────────────────────────

const ISO2_DISPLAY: Record<string, string> = {
    il: "Israel", ir: "Iran", sy: "Syria", iq: "Iraq", ps: "Palestine",
    lb: "Lebanon", ye: "Yemen", sa: "Saudi Arabia", tr: "Turkey", eg: "Egypt",
    jo: "Jordan", ae: "UAE", qa: "Qatar", kw: "Kuwait", bh: "Bahrain", om: "Oman",
    ua: "Ukraine", ru: "Russia", by: "Belarus", pl: "Poland", de: "Germany",
    fr: "France", gb: "United Kingdom", es: "Spain", it: "Italy", gr: "Greece", rs: "Serbia",
    cn: "China", kp: "North Korea", kr: "South Korea", tw: "Taiwan", jp: "Japan",
    in: "India", pk: "Pakistan", af: "Afghanistan", bd: "Bangladesh", mm: "Myanmar",
    ne: "Niger", ml: "Mali", bf: "Burkina Faso", et: "Ethiopia", so: "Somalia",
    sd: "Sudan", ss: "South Sudan", cd: "DR Congo", ng: "Nigeria", ke: "Kenya",
    mz: "Mozambique", ly: "Libya", cm: "Cameroon",
    co: "Colombia", mx: "Mexico", ve: "Venezuela", br: "Brazil", ht: "Haiti",
    kz: "Kazakhstan", kg: "Kyrgyzstan", tj: "Tajikistan", uz: "Uzbekistan",
    us: "United States", ca: "Canada", au: "Australia",
};

function displayName(key: string): string {
    if (ISO2_DISPLAY[key]) return ISO2_DISPLAY[key];
    return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Zone computation ─────────────────────────────────────────────────────────

/**
 * Groups ArticleDocuments by country key, scores each group, and returns
 * a list of ConflictZoneDocuments ready for MongoDB upsert.
 *
 * The country grouping uses ISO2 codes from newsdata.io, resolved to our
 * coordinate map keys via `resolveCountryKeys`.
 */
export function computeConflictZones(
    articlesByCountry: Map<string, ArticleDocument[]>
): Omit<ConflictZoneDocument, "_id">[] {
    // Collect per-zone data
    const zoneMap = new Map<
        string,
        {
            key: string;
            articles: ArticleDocument[];
            primaryCountries: string[];
        }
    >();

    // Pre-populate zoneMap with all known conflict theaters to ensure
    // they remain on the map even when mention counts drop to 0.
    for (const theater of CONFLICT_THEATERS) {
        const resolvedKeys = resolveCountryKeys(theater.primaryCountries, theater.primaryCountries);
        const finalKey = resolvedKeys[0] ?? (COUNTRY_COORDINATES[theater.primaryCountries[0]] ? theater.primaryCountries[0] : null);

        if (finalKey && !zoneMap.has(finalKey)) {
            zoneMap.set(finalKey, {
                key: finalKey,
                articles: [],
                primaryCountries: [...theater.primaryCountries],
            });
        }
    }

    for (const [rawKey, articles] of articlesByCountry.entries()) {
        // rawKey is a country code from newsdata (e.g. "il", "ua") or
        // possibly our internal key (e.g. "israel")
        const resolvedKeys = resolveCountryKeys(
            [rawKey],
            articles[0] ? [rawKey] : []
        );

        // Try direct lookup if resolution fails
        const finalKey =
            resolvedKeys[0] ??
            (COUNTRY_COORDINATES[rawKey] ? rawKey : null);

        if (!finalKey) continue; // can't geocode, skip

        const existing = zoneMap.get(finalKey);
        if (existing) {
            existing.articles.push(...articles);
        } else {
            zoneMap.set(finalKey, {
                key: finalKey,
                articles: [...articles],
                primaryCountries: [rawKey],
            });
        }
    }

    // First pass: collect mention counts for Z-score
    const mentionCounts = Array.from(zoneMap.values()).map(
        (z) => z.articles.length
    );
    const { mean, std } = computeMeanStd(mentionCounts);

    const now = new Date();
    const ttl = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours TTL

    const zones: Omit<ConflictZoneDocument, "_id">[] = [];

    for (const [zoneKey, data] of zoneMap.entries()) {
        const coords = COUNTRY_COORDINATES[zoneKey];
        if (!coords) continue;

        const region = COUNTRY_TO_REGION[zoneKey] ?? "unknown";

        // Score using keyword engine
        const goldsteinScores = data.articles.map(articleToGoldstein);
        const avgGoldstein =
            goldsteinScores.reduce((a, b) => a + b, 0) / goldsteinScores.length;

        const conflictScore = goldsteinToConflictScore(avgGoldstein);
        const color = scoreToColor(conflictScore);
        const mentionCount = data.articles.length;
        const zScore = std > 0 ? (mentionCount - mean) / std : 0;
        const isPulsing = zScore >= PULSE_Z_SCORE_THRESHOLD;

        // Extract top keywords
        const kwFreq = new Map<string, number>();
        for (const a of data.articles) {
            for (const kw of a.keywords ?? []) {
                kwFreq.set(kw, (kwFreq.get(kw) ?? 0) + 1);
            }
        }
        const topKeywords = Array.from(kwFreq.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([k]) => k);

        // Only embed the most recent 15 articles in the zone to keep docs lean
        const recentArticles = data.articles
            .sort(
                (a, b) =>
                    new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
            )
            .slice(0, 15);

        zones.push({
            zoneKey,
            country: displayName(zoneKey),
            lat: coords[0],
            lng: coords[1],
            region,
            conflictScore,
            color,
            mentionCount,
            isPulsing,
            topKeywords,
            articles: recentArticles,
            computedAt: now,
            ttl,
        });
    }

    return zones;
}
