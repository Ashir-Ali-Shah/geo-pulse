/**
 * app/api/sync/route.ts
 *
 * Sync endpoint — fetches news for all conflict theaters, deduplicates,
 * stores in MongoDB, and recomputes conflict zones.
 *
 * GET  /api/sync         → returns last sync status
 * POST /api/sync         → triggers a full sync (returns immediately, runs in bg)
 * POST /api/sync?inline=1 → triggers sync and waits for completion (for testing)
 */

import { NextRequest, NextResponse } from "next/server";
import {
    ensureIndexes,
    upsertArticles,
    upsertConflictZones,
    getRecentArticlesByCountry,
    createSyncLog,
    updateSyncLog,
    getLastSyncLog,
} from "@/lib/db/articleRepository";
import {
    fetchAllConflictTheaters,
    toArticleDocument,
    resolveCountryKeys,
    CONFLICT_THEATERS,
} from "@/lib/conflictQueryService";
import { computeConflictZones } from "@/lib/zoneComputer";
import { ArticleDocument } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

// ─── GET: Status check ────────────────────────────────────────────────────────

export async function GET() {
    try {
        await ensureIndexes();
        const last = await getLastSyncLog();
        return NextResponse.json({ status: "ok", lastSync: last });
    } catch (err) {
        return NextResponse.json(
            { status: "error", error: (err as Error).message },
            { status: 500 }
        );
    }
}

// ─── POST: Trigger sync ───────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const inline = searchParams.get("inline") === "1";

    try {
        await ensureIndexes();
    } catch (err) {
        return NextResponse.json(
            { error: "DB init failed: " + (err as Error).message },
            { status: 500 }
        );
    }

    if (inline) {
        // Wait for the full sync before responding
        const result = await runFullSync();
        return NextResponse.json(result);
    } else {
        // Fire-and-forget — respond immediately
        runFullSync().catch((e) =>
            console.error("[Sync] Background sync failed:", e)
        );
        return NextResponse.json({
            status: "started",
            message: "Sync running in background. Poll GET /api/sync for status.",
        });
    }
}

// ─── Core sync pipeline ───────────────────────────────────────────────────────

async function runFullSync() {
    const startedAt = new Date();
    const queriesAttempted = CONFLICT_THEATERS.map((t) => t.key);
    const queriesSucceeded: string[] = [];
    const queriesFailed: string[] = [];
    const errors: string[] = [];

    // Create a sync log entry
    const logId = await createSyncLog({
        startedAt,
        completedAt: null,
        queriesAttempted,
        queriesSucceeded: [],
        queriesFailed: [],
        articlesUpserted: 0,
        errors: [],
        status: "running",
    });

    let totalArticlesUpserted = 0;

    try {
        // 1. Fetch from all conflict theaters (rate-limit-safe)
        const { results, totalFetched } = await fetchAllConflictTheaters();

        // 2. Convert to ArticleDocuments and upsert into MongoDB
        const allDocs: ArticleDocument[] = [];

        for (const result of results) {
            if (result.error) {
                queriesFailed.push(result.query.key);
                errors.push(`${result.query.key}: ${result.error}`);
                continue;
            }

            queriesSucceeded.push(result.query.key);

            for (const article of result.articles) {
                const doc = toArticleDocument(article, result.query);
                allDocs.push(doc);
            }
        }

        totalArticlesUpserted = await upsertArticles(allDocs);

        // 3. Recompute conflict zones from all recent articles in MongoDB
        const articlesByCountry = await getRecentArticlesByCountry(24);

        // Also group by our resolved country keys (handle ISO2 from newsdata)
        const resolvedMap = new Map<string, ArticleDocument[]>();
        for (const [rawKey, articles] of articlesByCountry.entries()) {
            const keys = resolveCountryKeys([rawKey], [rawKey]);
            const resolvedKey = keys[0] ?? rawKey;
            const existing = resolvedMap.get(resolvedKey) ?? [];
            existing.push(...articles);
            resolvedMap.set(resolvedKey, existing);
        }

        const zones = computeConflictZones(resolvedMap);
        await upsertConflictZones(zones);

        // 4. Update sync log
        const completedAt = new Date();
        await updateSyncLog(logId, {
            completedAt,
            queriesSucceeded,
            queriesFailed,
            articlesUpserted: totalArticlesUpserted,
            errors,
            status:
                queriesFailed.length === 0
                    ? "complete"
                    : queriesSucceeded.length > 0
                        ? "partial"
                        : "failed",
        });

        console.log(
            `[Sync] Done. ${totalFetched} fetched, ${totalArticlesUpserted} upserted, ${zones.length} zones computed.`
        );

        return {
            status: queriesFailed.length === 0 ? "complete" : "partial",
            queriesSucceeded,
            queriesFailed,
            errors,
            articlesUpserted: totalArticlesUpserted,
            zonesComputed: zones.length,
            zones: zones.map((z) => ({
                country: z.country,
                score: z.conflictScore,
                color: z.color,
                articles: z.mentionCount,
                pulsing: z.isPulsing,
            })),
            durationMs: Date.now() - startedAt.getTime(),
        };
    } catch (err) {
        const msg = (err as Error).message;
        errors.push(msg);
        await updateSyncLog(logId, {
            completedAt: new Date(),
            status: "failed",
            errors,
            queriesSucceeded,
            queriesFailed,
        });
        throw err;
    }
}
