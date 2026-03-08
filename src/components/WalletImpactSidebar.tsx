"use client";

import { useEffect, useState, useCallback } from "react";
import {
    X,
    TrendingUp,
    TrendingDown,
    Minus,
    Globe,
    AlertTriangle,
    Newspaper,
    BarChart2,
    ExternalLink,
    Shield,
} from "lucide-react";
import { ConflictEvent, RegionImpact, Commodity } from "@/types";
import { isCredibleSource } from "@/lib/dataProcessor";
import { CONFLICT_COLORS } from "@/lib/constants";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WalletImpactSidebarProps {
    event: ConflictEvent | null;
    isOpen: boolean;
    onClose: () => void;
    credibilityOnly: boolean;
}

// ─── Risk badge ───────────────────────────────────────────────────────────────

const RISK_CONFIG = {
    critical: {
        label: "CRITICAL",
        bg: "bg-red-900/50",
        border: "border-red-500/60",
        text: "text-red-400",
    },
    high: {
        label: "HIGH",
        bg: "bg-orange-900/40",
        border: "border-orange-500/60",
        text: "text-orange-400",
    },
    moderate: {
        label: "MODERATE",
        bg: "bg-yellow-900/40",
        border: "border-yellow-500/60",
        text: "text-yellow-400",
    },
    low: {
        label: "LOW",
        bg: "bg-green-900/30",
        border: "border-green-500/60",
        text: "text-green-400",
    },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function CommodityRow({ commodity }: { commodity: Commodity }) {
    const isUp = commodity.trend === "up";
    const isDown = commodity.trend === "down";
    const TrendIcon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;
    const trendColor = isUp
        ? "text-green-400"
        : isDown
            ? "text-red-400"
            : "text-slate-400";

    return (
        <div className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
            <div>
                <p className="text-sm font-medium text-white">{commodity.name}</p>
                <p className="text-xs text-slate-500 font-mono">{commodity.symbol}</p>
            </div>
            <div className="text-right">
                <p className="text-sm font-mono font-bold text-white">
                    {commodity.price.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    })}{" "}
                    <span className="text-xs font-normal text-slate-500">
                        {commodity.unit}
                    </span>
                </p>
                <div className={`flex items-center justify-end gap-0.5 ${trendColor}`}>
                    <TrendIcon size={11} />
                    <span className="text-xs font-mono">
                        {commodity.changePercent >= 0 ? "+" : ""}
                        {commodity.changePercent.toFixed(2)}%
                    </span>
                </div>
            </div>
        </div>
    );
}

function ArticleCard({
    article,
    credibleOnly,
}: {
    article: { title: string; link: string; source_url: string; pubDate: string };
    credibleOnly: boolean;
}) {
    const credible = isCredibleSource(article.source_url);
    if (credibleOnly && !credible) return null;

    return (
        <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block group"
        >
            <div className="flex gap-2 py-2 border-b border-white/5 last:border-0 hover:bg-white/5 -mx-1 px-1 rounded transition-colors">
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed group-hover:text-white transition-colors">
                        {article.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                        {credible && (
                            <span className="flex items-center gap-0.5 text-[10px] text-emerald-400 font-mono">
                                <Shield size={8} />
                                VERIFIED
                            </span>
                        )}
                        <span className="text-[10px] text-slate-600 font-mono">
                            {new Date(article.pubDate).toLocaleDateString()}
                        </span>
                    </div>
                </div>
                <ExternalLink
                    size={12}
                    className="text-slate-600 group-hover:text-slate-400 mt-0.5 flex-shrink-0"
                />
            </div>
        </a>
    );
}

// ─── Main Sidebar ─────────────────────────────────────────────────────────────

export default function WalletImpactSidebar({
    event,
    isOpen,
    onClose,
    credibilityOnly,
}: WalletImpactSidebarProps) {
    const [impact, setImpact] = useState<RegionImpact | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchImpact = useCallback(async (region: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/commodities?region=${region}`);
            const data = await res.json();
            setImpact(data.regions?.[0] ?? null);
        } catch {
            setImpact(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (event && isOpen) {
            fetchImpact(event.region);
        }
    }, [event, isOpen, fetchImpact]);

    if (!isOpen || !event) return null;

    const accentColor = CONFLICT_COLORS[event.color];
    const riskConfig =
        impact ? RISK_CONFIG[impact.riskLevel] : RISK_CONFIG.low;

    const displayArticles = event.articles.slice(0, 8);

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Sidebar panel */}
            <aside
                className="fixed right-0 top-0 h-full w-96 z-50 flex flex-col"
                style={{
                    background:
                        "linear-gradient(135deg, rgba(10,15,30,0.96) 0%, rgba(15,20,40,0.98) 100%)",
                    backdropFilter: "blur(20px)",
                    borderLeft: `1px solid ${accentColor}40`,
                    boxShadow: `-20px 0 60px ${accentColor}15`,
                }}
            >
                {/* Header */}
                <div
                    className="flex items-start justify-between p-5 border-b"
                    style={{ borderColor: `${accentColor}30` }}
                >
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            {event.isPulsing && (
                                <span className="flex items-center gap-1 text-xs text-red-400 font-mono bg-red-950/50 px-2 py-0.5 rounded-full border border-red-800/50">
                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                                    HOTSPOT
                                </span>
                            )}
                            {impact && (
                                <span
                                    className={`text-xs font-mono px-2 py-0.5 rounded-full border ${riskConfig.bg} ${riskConfig.border} ${riskConfig.text}`}
                                >
                                    {riskConfig.label}
                                </span>
                            )}
                        </div>
                        <h2 className="text-lg font-bold text-white truncate">
                            {event.country}
                        </h2>
                        <div className="flex items-center gap-3 mt-1">
                            <span
                                className="text-2xl font-black font-mono"
                                style={{ color: accentColor }}
                            >
                                {event.conflictScore}
                            </span>
                            <span className="text-xs text-slate-500 font-mono">
                                conflict score
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
                        aria-label="Close sidebar"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Score bar */}
                <div className="px-5 py-3 border-b border-white/5">
                    <div className="flex justify-between text-[10px] text-slate-600 font-mono mb-1.5">
                        <span>STABILITY</span>
                        <span>CONFLICT</span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                                width: `${event.conflictScore}%`,
                                background: `linear-gradient(90deg, #16a34a, #f59e0b, ${accentColor})`,
                            }}
                        />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                        <span>0</span>
                        <span>{event.mentionCount} articles tracked</span>
                        <span>100</span>
                    </div>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto scrollbar-thin">
                    {/* Keywords */}
                    {event.topKeywords.length > 0 && (
                        <div className="px-5 py-4 border-b border-white/5">
                            <div className="flex items-center gap-2 mb-3">
                                <BarChart2 size={14} className="text-slate-500" />
                                <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                                    Top Keywords
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {event.topKeywords.map((kw) => (
                                    <span
                                        key={kw}
                                        className="text-xs px-2 py-0.5 rounded font-mono"
                                        style={{
                                            background: `${accentColor}15`,
                                            border: `1px solid ${accentColor}30`,
                                            color: accentColor,
                                        }}
                                    >
                                        {kw}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Commodity Impact */}
                    <div className="px-5 py-4 border-b border-white/5">
                        <div className="flex items-center gap-2 mb-3">
                            <Globe size={14} className="text-slate-500" />
                            <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                                Wallet Impact
                            </span>
                            {impact && (
                                <span className="text-xs text-slate-600 ml-auto font-mono">
                                    {impact.displayName}
                                </span>
                            )}
                        </div>

                        {loading ? (
                            <div className="space-y-2">
                                {[1, 2, 3].map((i) => (
                                    <div
                                        key={i}
                                        className="h-10 rounded bg-white/5 animate-pulse"
                                    />
                                ))}
                            </div>
                        ) : impact ? (
                            <>
                                <p className="text-xs text-slate-400 leading-relaxed mb-3 italic">
                                    {impact.summary}
                                </p>
                                <div>
                                    {impact.commodities.map((c) => (
                                        <CommodityRow key={c.symbol} commodity={c} />
                                    ))}
                                </div>
                            </>
                        ) : (
                            <p className="text-xs text-slate-600">
                                No commodity data available.
                            </p>
                        )}
                    </div>

                    {/* News Articles */}
                    <div className="px-5 py-4">
                        <div className="flex items-center gap-2 mb-3">
                            <Newspaper size={14} className="text-slate-500" />
                            <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                                Latest News
                            </span>
                            {credibilityOnly && (
                                <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-mono ml-auto">
                                    <Shield size={9} />
                                    Verified Only
                                </span>
                            )}
                        </div>
                        <div>
                            {displayArticles.length > 0 ? (
                                displayArticles.map((article) => (
                                    <ArticleCard
                                        key={article.article_id}
                                        article={article}
                                        credibleOnly={credibilityOnly}
                                    />
                                ))
                            ) : (
                                <p className="text-xs text-slate-600">
                                    {credibilityOnly
                                        ? "No verified sources found for this region."
                                        : "No articles available."}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div
                    className="px-5 py-3 border-t text-xs text-slate-600 font-mono"
                    style={{ borderColor: `${accentColor}20` }}
                >
                    <div className="flex items-center gap-1">
                        <AlertTriangle size={10} className="text-yellow-600" />
                        Not financial advice — informational only
                    </div>
                </div>
            </aside>
        </>
    );
}
