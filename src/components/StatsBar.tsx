"use client";

import { Globe, AlertTriangle, Activity, Newspaper, RefreshCw } from "lucide-react";
import { GlobalStats } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StatsBarProps {
    stats: GlobalStats | null;
    fetchedAt: string | null;
    loading: boolean;
    onRefresh: () => void;
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
    icon: Icon,
    label,
    value,
    accent,
    sub,
}: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    accent?: string;
    sub?: string;
}) {
    return (
        <div className="flex items-center gap-3 px-4 py-2.5">
            <div
                className="p-2 rounded-lg"
                style={{ background: `${accent ?? "#3b82f6"}20` }}
            >
                <Icon size={14} style={{ color: accent ?? "#3b82f6" }} />
            </div>
            <div>
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
                    {label}
                </p>
                <p
                    className="text-sm font-bold font-mono"
                    style={{ color: accent ?? "white" }}
                >
                    {value}
                    {sub && <span className="text-xs text-slate-500 ml-1">{sub}</span>}
                </p>
            </div>
        </div>
    );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────

export default function StatsBar({
    stats,
    fetchedAt,
    loading,
    onRefresh,
}: StatsBarProps) {
    const formattedTime = fetchedAt
        ? new Date(fetchedAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        })
        : "--:--";

    return (
        <div
            className="flex items-center justify-between gap-2 overflow-x-auto"
            style={{
                background: "rgba(10,15,30,0.95)",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                backdropFilter: "blur(20px)",
            }}
        >
            <div className="flex items-center divide-x divide-white/5">
                <StatCard
                    icon={Globe}
                    label="Active Zones"
                    value={loading ? "…" : (stats?.totalEvents ?? 0)}
                    accent="#3b82f6"
                />
                <StatCard
                    icon={AlertTriangle}
                    label="Critical"
                    value={loading ? "…" : (stats?.criticalZones ?? 0)}
                    accent="#C62828"
                />
                <StatCard
                    icon={Activity}
                    label="Peak Score"
                    value={loading ? "…" : (stats?.highestConflictScore ?? 0)}
                    accent="#F59E0B"
                />
                <StatCard
                    icon={Newspaper}
                    label="Articles"
                    value={loading ? "…" : (stats?.totalArticles ?? 0).toLocaleString()}
                    accent="#16a34a"
                />
            </div>

            <div className="flex items-center gap-3 pr-4 flex-shrink-0">
                <span className="text-[10px] text-slate-600 font-mono hidden sm:block">
                    Updated {formattedTime}
                </span>
                <button
                    onClick={onRefresh}
                    disabled={loading}
                    className="p-1.5 rounded text-slate-500 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40"
                    aria-label="Refresh data"
                >
                    <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                </button>
            </div>
        </div>
    );
}
