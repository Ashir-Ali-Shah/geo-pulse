"use client";

import { Activity, Satellite, Database, RefreshCw } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
    onSync?: () => void;
    isSyncing?: boolean;
    dataSource?: string;
}

export default function Header({
    onSync,
    isSyncing = false,
    dataSource,
}: HeaderProps) {
    const [syncMsg, setSyncMsg] = useState<string | null>(null);

    async function handleSync() {
        if (isSyncing) return;
        setSyncMsg("Starting sync…");
        try {
            const res = await fetch("/api/sync?inline=1", { method: "POST" });
            const data = await res.json();
            const msg =
                data.status === "complete"
                    ? `✓ ${data.zonesComputed} zones synced`
                    : data.status === "partial"
                        ? `⚠ ${data.zonesComputed} zones (${data.queriesFailed?.length} failed)`
                        : "Sync started";
            setSyncMsg(msg);
            setTimeout(() => setSyncMsg(null), 4000);
            if (onSync) onSync();
        } catch {
            setSyncMsg("Sync error");
            setTimeout(() => setSyncMsg(null), 3000);
        }
    }

    return (
        <header
            className="flex items-center justify-between px-5 h-14 flex-shrink-0"
            style={{
                background:
                    "linear-gradient(90deg, rgba(8,12,24,0.98) 0%, rgba(12,18,35,0.98) 100%)",
                borderBottom: "1px solid rgba(59,130,246,0.15)",
                backdropFilter: "blur(20px)",
            }}
        >
            {/* Logo */}
            <div className="flex items-center gap-3">
                <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                        background: "linear-gradient(135deg, #1d4ed8 0%, #6d28d9 100%)",
                        boxShadow: "0 0 16px rgba(99,102,241,0.4)",
                    }}
                >
                    <Satellite size={16} className="text-white" />
                </div>
                <div>
                    <h1 className="text-sm font-black tracking-tight text-white font-mono">
                        GEO<span className="text-blue-400">PULSE</span>
                    </h1>
                    <p className="text-[9px] text-slate-600 font-mono tracking-widest uppercase">
                        Global Conflict Predictor
                    </p>
                </div>
            </div>

            {/* Right side controls */}
            <div className="flex items-center gap-2">
                {/* Sync message */}
                {syncMsg && (
                    <span className="text-[10px] font-mono text-blue-400 bg-blue-950/50 border border-blue-800/40 rounded-full px-3 py-1">
                        {syncMsg}
                    </span>
                )}

                {/* Data source badge */}
                {dataSource && (
                    <div
                        className="hidden sm:flex items-center gap-1.5 text-slate-600 bg-white/5 border border-white/8 rounded px-2 py-1"
                        title="Data source"
                    >
                        <Database size={10} />
                        <span className="text-[10px] font-mono">
                            {dataSource === "mongodb" ? "MongoDB cache" : "Live API"}
                        </span>
                    </div>
                )}

                {/* Manual sync button */}
                <button
                    id="sync-button"
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all disabled:opacity-50"
                    style={{
                        background: isSyncing
                            ? "rgba(99,102,241,0.1)"
                            : "rgba(99,102,241,0.15)",
                        border: "1px solid rgba(99,102,241,0.3)",
                        color: "#818cf8",
                    }}
                    title="Sync all 16 conflict theaters from newsdata.io → MongoDB"
                >
                    <RefreshCw
                        size={11}
                        className={isSyncing ? "animate-spin" : ""}
                    />
                    <span className="hidden sm:inline">
                        {isSyncing ? "Syncing…" : "Sync Now"}
                    </span>
                </button>

                {/* Live indicator */}
                <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
                    <span
                        className="w-1.5 h-1.5 rounded-full animate-pulse"
                        style={{ background: isSyncing ? "#818cf8" : "#4ade80" }}
                    />
                    <span
                        className="text-[10px] font-mono"
                        style={{ color: isSyncing ? "#818cf8" : "#4ade80" }}
                    >
                        {isSyncing ? "SYNCING" : "LIVE"}
                    </span>
                </div>

                <div className="hidden sm:flex items-center gap-1.5 text-slate-600">
                    <Activity size={12} />
                    <span className="text-[10px] font-mono">newsdata.io</span>
                </div>
            </div>
        </header>
    );
}
