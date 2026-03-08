// ─── News & Events ───────────────────────────────────────────────────────────

export interface NewsArticle {
    article_id: string;
    title: string;
    link: string;
    description: string | null;
    pubDate: string;
    source_name: string;
    source_url: string;
    country: string[] | null;
    category: string[] | null;
    sentiment: "positive" | "negative" | "neutral" | null;
    sentiment_stats: {
        positive?: number;
        neutral?: number;
        negative?: number;
    } | null;
    keywords: string[] | null;
    image_url: string | null;
    // Computed fields
    lat?: number;
    lng?: number;
    conflictScore?: number;
    colorCode?: ConflictColor;
    isPulsing?: boolean;
}

export interface NewsDataResponse {
    status: string;
    totalResults: number;
    results: NewsArticle[];
    nextPage?: string;
}

// ─── Conflict Scoring ────────────────────────────────────────────────────────

export type ConflictColor = "red" | "amber" | "green";

export interface ConflictEvent {
    id: string;
    lat: number;
    lng: number;
    country: string;
    region: RegionKey;
    conflictScore: number;
    color: ConflictColor;
    mentionCount: number;
    isPulsing: boolean;
    articles: NewsArticle[];
    topKeywords: string[];
}

// ─── Commodities ─────────────────────────────────────────────────────────────

export interface Commodity {
    name: string;
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    unit: string;
    trend: "up" | "down" | "flat";
}

export interface RegionImpact {
    region: RegionKey;
    displayName: string;
    commodities: Commodity[];
    riskLevel: "critical" | "high" | "moderate" | "low";
    summary: string;
}

export type RegionKey =
    | "middle_east"
    | "europe"
    | "east_asia"
    | "south_asia"
    | "africa"
    | "latin_america"
    | "north_america"
    | "oceania"
    | "central_asia"
    | "unknown";

// ─── Statistics ──────────────────────────────────────────────────────────────

export interface GlobalStats {
    totalEvents: number;
    criticalZones: number;
    totalArticles: number;
    highestConflictScore: number;
    meanMentionCount: number;
    stdDevMentionCount: number;
}

// ─── API Responses ───────────────────────────────────────────────────────────

export interface GdeltApiResponse {
    events: ConflictEvent[];
    stats: GlobalStats;
    fetchedAt: string;
}

export interface CommodityApiResponse {
    regions: RegionImpact[];
    fetchedAt: string;
}

// ─── UI State ────────────────────────────────────────────────────────────────

export interface MapFilter {
    showRed: boolean;
    showAmber: boolean;
    showGreen: boolean;
    credibilityOnly: boolean;
    minScore: number;
}

export interface SidebarState {
    isOpen: boolean;
    selectedEvent: ConflictEvent | null;
}
