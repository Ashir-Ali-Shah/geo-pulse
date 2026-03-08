/**
 * lib/db/schema.ts
 *
 * MongoDB collection names and document type definitions.
 * This is the single source of truth for what's stored in MongoDB.
 *
 * Collections:
 *   articles       — raw articles fetched from newsdata.io (deduplicated by article_id)
 *   sync_log       — history of each sync run (for monitoring / debugging)
 *   conflict_zones — pre-computed conflict zone summaries (served to the map)
 */

import { ObjectId } from "mongodb";

// ─── Collection names ─────────────────────────────────────────────────────────

export const COLLECTIONS = {
    ARTICLES: "articles",
    SYNC_LOG: "sync_log",
    CONFLICT_ZONES: "conflict_zones",
} as const;

// ─── Article document ─────────────────────────────────────────────────────────

export interface ArticleDocument {
    _id?: ObjectId;
    article_id: string;           // newsdata.io unique ID — used as upsert key
    title: string;
    link: string;
    description: string | null;
    pubDate: string;              // ISO string from newsdata.io
    source_name: string;
    source_url: string;
    country: string[];
    category: string[];
    keywords: string[] | null;
    image_url: string | null;
    conflictQuery: string;        // which query fetched this (e.g. "ukraine war")
    fetchedAt: Date;              // when we stored it
    ttl: Date;                   // TTL index for auto-expiry (24 h)
}

// ─── Sync log document ────────────────────────────────────────────────────────

export interface SyncLogDocument {
    _id?: ObjectId;
    startedAt: Date;
    completedAt: Date | null;
    queriesAttempted: string[];
    queriesSucceeded: string[];
    queriesFailed: string[];
    articlesUpserted: number;
    errors: string[];
    status: "running" | "complete" | "partial" | "failed";
}

// ─── Conflict zone document ───────────────────────────────────────────────────

export interface ConflictZoneDocument {
    _id?: ObjectId;
    zoneKey: string;              // e.g. "ukraine" — upsert key
    country: string;              // display name
    lat: number;
    lng: number;
    region: string;
    conflictScore: number;        // 0–100
    color: "red" | "amber" | "green";
    mentionCount: number;
    isPulsing: boolean;
    topKeywords: string[];
    articles: ArticleDocument[];  // embedded article subset
    computedAt: Date;
    ttl: Date;                   // expires in 2 hours
}
