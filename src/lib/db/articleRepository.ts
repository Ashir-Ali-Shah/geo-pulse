/**
 * lib/db/articleRepository.ts
 *
 * Data access layer for articles and conflict zones in MongoDB.
 * Single Responsibility: all MongoDB reads/writes go through here.
 */

import { Db } from "mongodb";
import { getDb } from "./connection";
import {
    COLLECTIONS,
    ArticleDocument,
    ConflictZoneDocument,
    SyncLogDocument,
} from "./schema";
import { ConflictEvent, GlobalStats } from "@/types";

// ─── Initialisation ───────────────────────────────────────────────────────────

let _initialised = false;

/**
 * Creates all required indexes once per process.
 * Call this before any reads/writes.
 */
export async function ensureIndexes(): Promise<void> {
    if (_initialised) return;
    const db = await getDb();

    // articles: unique on article_id, TTL on ttl field
    const articles = db.collection<ArticleDocument>(COLLECTIONS.ARTICLES);
    await articles.createIndex({ article_id: 1 }, { unique: true });
    await articles.createIndex({ ttl: 1 }, { expireAfterSeconds: 0 }); // TTL
    await articles.createIndex({ country: 1 });
    await articles.createIndex({ conflictQuery: 1 });
    await articles.createIndex({ fetchedAt: -1 });

    // conflict_zones: unique on zoneKey, TTL on ttl field
    const zones = db.collection<ConflictZoneDocument>(COLLECTIONS.CONFLICT_ZONES);
    await zones.createIndex({ zoneKey: 1 }, { unique: true });
    await zones.createIndex({ ttl: 1 }, { expireAfterSeconds: 0 });
    await zones.createIndex({ conflictScore: -1 });
    await zones.createIndex({ computedAt: -1 });

    // sync_log: TTL 7 days
    const log = db.collection<SyncLogDocument>(COLLECTIONS.SYNC_LOG);
    await log.createIndex(
        { startedAt: 1 },
        { expireAfterSeconds: 7 * 24 * 60 * 60 }
    );

    _initialised = true;
}

// ─── Article writes ───────────────────────────────────────────────────────────

/**
 * Upserts a batch of articles into MongoDB.
 * Returns the count of documents actually inserted/updated.
 */
export async function upsertArticles(
    articles: Omit<ArticleDocument, "_id">[]
): Promise<number> {
    if (articles.length === 0) return 0;
    const db = await getDb();
    const col = db.collection<ArticleDocument>(COLLECTIONS.ARTICLES);

    const ops = articles.map((a) => ({
        updateOne: {
            filter: { article_id: a.article_id },
            update: { $setOnInsert: a },
            upsert: true,
        },
    }));

    const result = await col.bulkWrite(ops, { ordered: false });
    return result.upsertedCount;
}

// ─── Article reads ────────────────────────────────────────────────────────────

/**
 * Returns articles grouped by country, from the last `maxAgeHours` hours.
 */
export async function getRecentArticlesByCountry(
    maxAgeHours = 24
): Promise<Map<string, ArticleDocument[]>> {
    const db = await getDb();
    const col = db.collection<ArticleDocument>(COLLECTIONS.ARTICLES);
    const since = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);

    const docs = await col
        .find({ fetchedAt: { $gte: since } })
        .sort({ fetchedAt: -1 })
        .toArray();

    const grouped = new Map<string, ArticleDocument[]>();
    for (const doc of docs) {
        for (const c of doc.country ?? []) {
            const key = c.toLowerCase();
            const arr = grouped.get(key) ?? [];
            arr.push(doc);
            grouped.set(key, arr);
        }
    }
    return grouped;
}

// ─── Conflict zone writes ─────────────────────────────────────────────────────

export async function upsertConflictZones(
    zones: Omit<ConflictZoneDocument, "_id">[]
): Promise<void> {
    if (zones.length === 0) return;
    const db = await getDb();
    const col = db.collection<ConflictZoneDocument>(COLLECTIONS.CONFLICT_ZONES);

    const ops = zones.map((z) => ({
        updateOne: {
            filter: { zoneKey: z.zoneKey },
            update: { $set: z },
            upsert: true,
        },
    }));

    await col.bulkWrite(ops, { ordered: false });
}

// ─── Conflict zone reads ──────────────────────────────────────────────────────

/**
 * Returns all non-expired conflict zones as ConflictEvents.
 */
export async function getConflictZones(): Promise<{
    events: ConflictEvent[];
    stats: GlobalStats;
    computedAt: string;
}> {
    const db = await getDb();
    const col = db.collection<ConflictZoneDocument>(COLLECTIONS.CONFLICT_ZONES);

    const zones = await col.find({}).sort({ conflictScore: -1 }).toArray();

    const events: ConflictEvent[] = zones.map((z) => ({
        id: z.zoneKey,
        lat: z.lat,
        lng: z.lng,
        country: z.country,
        region: z.region as ConflictEvent["region"],
        conflictScore: z.conflictScore,
        color: z.color,
        mentionCount: z.mentionCount,
        isPulsing: z.isPulsing,
        topKeywords: z.topKeywords,
        articles: z.articles.map((a) => ({
            article_id: a.article_id,
            title: a.title,
            link: a.link,
            description: a.description,
            pubDate: a.pubDate,
            source_name: a.source_name,
            source_url: a.source_url,
            country: a.country,
            category: a.category,
            keywords: a.keywords,
            image_url: a.image_url,
            sentiment: null,
            sentiment_stats: null,
        })),
    }));

    const mentionCounts = events.map((e) => e.mentionCount);
    const mean =
        mentionCounts.length > 0
            ? mentionCounts.reduce((a, b) => a + b, 0) / mentionCounts.length
            : 0;

    const stats: GlobalStats = {
        totalEvents: events.length,
        criticalZones: events.filter((e) => e.color === "red").length,
        totalArticles: zones.reduce((s, z) => s + z.articles.length, 0),
        highestConflictScore: events.length > 0 ? events[0].conflictScore : 0,
        meanMentionCount: Math.round(mean),
        stdDevMentionCount: 0,
    };

    const latestZone = zones.sort(
        (a, b) =>
            new Date(b.computedAt).getTime() - new Date(a.computedAt).getTime()
    )[0];

    return {
        events,
        stats,
        computedAt: latestZone?.computedAt?.toISOString() ?? new Date().toISOString(),
    };
}

// ─── Sync log ─────────────────────────────────────────────────────────────────

export async function createSyncLog(
    data: Omit<SyncLogDocument, "_id">
): Promise<string> {
    const db = await getDb();
    const col = db.collection<SyncLogDocument>(COLLECTIONS.SYNC_LOG);
    const result = await col.insertOne(data as SyncLogDocument);
    return result.insertedId.toString();
}

export async function updateSyncLog(
    id: string,
    update: Partial<SyncLogDocument>
): Promise<void> {
    const db = await getDb();
    const { ObjectId } = await import("mongodb");
    const col = db.collection<SyncLogDocument>(COLLECTIONS.SYNC_LOG);
    await col.updateOne({ _id: new ObjectId(id) }, { $set: update });
}

export async function getLastSyncLog(): Promise<SyncLogDocument | null> {
    const db = await getDb();
    const col = db.collection<SyncLogDocument>(COLLECTIONS.SYNC_LOG);
    return col.findOne({}, { sort: { startedAt: -1 } });
}

export { getDb };
