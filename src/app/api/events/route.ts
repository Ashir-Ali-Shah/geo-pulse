/**
 * app/api/events/route.ts
 *
 * Serves pre-computed conflict zones from MongoDB.
 * Falls back to a direct newsdata.io fetch if MongoDB has no data yet.
 *
 * This design means:
 *   - Zero rate-limit risk at read time
 *   - Data is always fresh (synced independently via /api/sync)
 *   - Fast response times (MongoDB read << API call)
 */

import { NextResponse } from "next/server";
import {
    ensureIndexes,
    getConflictZones,
} from "@/lib/db/articleRepository";
import { fetchConflictNews } from "@/lib/newsService";
import {
    aggregateArticlesToEvents,
    computeGlobalStats,
} from "@/lib/dataProcessor";
import { GdeltApiResponse } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        await ensureIndexes();

        // 1. Try to serve from MongoDB first
        const { events, stats, computedAt } = await getConflictZones();

        if (events.length > 0) {
            const response: GdeltApiResponse = {
                events,
                stats,
                fetchedAt: computedAt,
            };
            return NextResponse.json(response, {
                headers: {
                    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
                    "X-Data-Source": "mongodb",
                },
            });
        }

        // 2. Fallback: direct newsdata.io fetch (when DB is empty on first run)
        console.log("[/api/events] MongoDB empty — falling back to direct fetch");
        const newsData = await fetchConflictNews();
        const articles = newsData.results ?? [];
        const fallbackEvents = aggregateArticlesToEvents(articles);
        const fallbackStats = computeGlobalStats(fallbackEvents, articles.length);

        const fallbackResponse: GdeltApiResponse = {
            events: fallbackEvents,
            stats: fallbackStats,
            fetchedAt: new Date().toISOString(),
        };

        return NextResponse.json(fallbackResponse, {
            headers: {
                "Cache-Control": "public, s-maxage=60",
                "X-Data-Source": "newsdata-direct",
            },
        });
    } catch (error) {
        console.error("[/api/events] Error:", error);
        return NextResponse.json(
            {
                error: (error as Error).message,
                events: [],
                stats: {
                    totalEvents: 0,
                    criticalZones: 0,
                    totalArticles: 0,
                    highestConflictScore: 0,
                    meanMentionCount: 0,
                    stdDevMentionCount: 0,
                },
                fetchedAt: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}
