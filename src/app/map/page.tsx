"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
import StatsBar from "@/components/StatsBar";
import FilterPanel from "@/components/FilterPanel";
import WalletImpactSidebar from "@/components/WalletImpactSidebar";
import { ConflictEvent, GlobalStats, MapFilter, GdeltApiResponse } from "@/types";

// ─── Dynamic import for Leaflet (client-only) ─────────────────────────────────
const ConflictMap = dynamic(() => import("@/components/ConflictMap"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-[#0a0f1e]">
            <div className="text-center space-y-4">
                <div className="w-12 h-12 border-2 border-blue-500/40 border-t-blue-500 rounded-full animate-spin mx-auto" />
                <p className="text-slate-500 text-sm font-mono tracking-widest">
                    INITIALISING SENSORS…
                </p>
            </div>
        </div>
    ),
});

// ─── Default filter state ─────────────────────────────────────────────────────

const DEFAULT_FILTERS: MapFilter = {
    showRed: true,
    showAmber: true,
    showGreen: true,
    credibilityOnly: false,
    minScore: 0,
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MapPage() {
    const [events, setEvents] = useState<ConflictEvent[]>([]);
    const [stats, setStats] = useState<GlobalStats | null>(null);
    const [fetchedAt, setFetchedAt] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<MapFilter>(DEFAULT_FILTERS);
    const [dataSource, setDataSource] = useState<string | undefined>(undefined);

    // Sidebar state
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<ConflictEvent | null>(null);

    // ─── Data fetching ──────────────────────────────────────────────────────────

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/events");
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data: GdeltApiResponse = await res.json();
            setEvents(data.events ?? []);
            setStats(data.stats ?? null);
            setFetchedAt(data.fetchedAt);
            // Read the X-Data-Source header
            setDataSource(res.headers.get("X-Data-Source") ?? undefined);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
        // Auto-refresh map data every 2 minutes
        const interval = setInterval(fetchData, 2 * 60 * 1000);
        return () => clearInterval(interval);
    }, [fetchData]);

    // ─── Event handlers ─────────────────────────────────────────────────────────

    function handleEventClick(event: ConflictEvent) {
        setSelectedEvent(event);
        setSidebarOpen(true);
    }

    function handleSidebarClose() {
        setSidebarOpen(false);
        setTimeout(() => setSelectedEvent(null), 300);
    }

    // Called after a manual sync completes — refresh the map data
    function handleSyncComplete() {
        setTimeout(fetchData, 500);
    }

    // ─── Render ─────────────────────────────────────────────────────────────────

    return (
        <div
            className="flex flex-col h-screen overflow-hidden"
            style={{ background: "#050810" }}
        >
            {/* Top nav */}
            <Header
                onSync={handleSyncComplete}
                isSyncing={syncing}
                dataSource={dataSource}
            />

            {/* Stats row */}
            <StatsBar
                stats={stats}
                fetchedAt={fetchedAt}
                loading={loading}
                onRefresh={fetchData}
            />

            {/* Map area */}
            <div className="relative flex-1 overflow-hidden">
                {/* Error overlay */}
                {error && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[2000] bg-red-950/90 border border-red-700/60 text-red-300 text-xs font-mono px-4 py-2 rounded-lg backdrop-blur-md max-w-sm text-center">
                        ⚠ {error}
                    </div>
                )}

                {/* Loading overlay */}
                {loading && events.length === 0 && (
                    <div className="absolute inset-0 z-[2000] flex items-center justify-center bg-[#050810]/80 backdrop-blur-sm">
                        <div className="text-center space-y-4">
                            <div className="relative w-16 h-16 mx-auto">
                                <div className="absolute inset-0 rounded-full border-2 border-blue-600/30 border-t-blue-500 animate-spin" />
                                <div className="absolute inset-2 rounded-full border-2 border-purple-600/20 border-t-purple-500 animate-spin animation-delay-150" style={{ animationDirection: "reverse" }} />
                            </div>
                            <div>
                                <p className="text-white text-sm font-mono font-bold">
                                    SCANNING GLOBAL SIGNALS
                                </p>
                                <p className="text-slate-500 text-xs font-mono mt-1">
                                    Loading from MongoDB…
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Empty state — prompt first sync */}
                {!loading && events.length === 0 && !error && (
                    <div className="absolute inset-0 z-[1500] flex items-center justify-center pointer-events-none">
                        <div
                            className="text-center p-8 rounded-2xl max-w-sm pointer-events-auto"
                            style={{
                                background: "rgba(10,15,30,0.95)",
                                border: "1px solid rgba(99,102,241,0.3)",
                                backdropFilter: "blur(20px)",
                                boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
                            }}
                        >
                            <div className="text-4xl mb-4">🛰️</div>
                            <h3 className="text-white font-bold text-lg mb-2">
                                No Conflict Data Yet
                            </h3>
                            <p className="text-slate-400 text-sm mb-5 leading-relaxed">
                                Click <strong className="text-indigo-400">Sync Now</strong> in the header
                                to fetch real-time data for all 16 conflict theaters and store
                                it in MongoDB.
                            </p>
                            <p className="text-slate-600 text-xs font-mono">
                                Iran–Israel · Ukraine · Gaza · Yemen ·{" "}
                                Sudan · China–Taiwan · +10 more
                            </p>
                        </div>
                    </div>
                )}

                {/* Map */}
                <ConflictMap
                    events={events}
                    filters={filters}
                    onEventClick={handleEventClick}
                />

                {/* Filter panel */}
                <FilterPanel filters={filters} onChange={setFilters} />

                {/* Event count badge */}
                {!loading && events.length > 0 && (
                    <div
                        className="absolute top-4 left-4 z-[1000] text-xs font-mono px-3 py-1.5 rounded-lg"
                        style={{
                            background: "rgba(10,15,30,0.9)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            backdropFilter: "blur(10px)",
                        }}
                    >
                        <span className="text-slate-400">
                            Showing{" "}
                            <span className="text-blue-400 font-bold">{events.length}</span>{" "}
                            active zones
                        </span>
                    </div>
                )}
            </div>

            {/* Wallet Impact Sidebar */}
            <WalletImpactSidebar
                event={selectedEvent}
                isOpen={sidebarOpen}
                onClose={handleSidebarClose}
                credibilityOnly={filters.credibilityOnly}
            />
        </div>
    );
}
