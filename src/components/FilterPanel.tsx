"use client";

import { Shield } from "lucide-react";
import { MapFilter } from "@/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FilterPanelProps {
    filters: MapFilter;
    onChange: (filters: MapFilter) => void;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ColorToggleProps {
    color: "red" | "amber" | "green";
    label: string;
    checked: boolean;
    accentHex: string;
    onChange: (val: boolean) => void;
}

function ColorToggle({
    color,
    label,
    checked,
    accentHex,
    onChange,
}: ColorToggleProps) {
    const ids = { red: "filter-red", amber: "filter-amber", green: "filter-green" };

    return (
        <label
            htmlFor={ids[color]}
            className="flex items-center gap-2 cursor-pointer group"
        >
            <div
                className="w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 transition-opacity"
                style={{
                    borderColor: accentHex,
                    background: checked ? accentHex : "transparent",
                    opacity: checked ? 1 : 0.4,
                }}
            />
            <input
                id={ids[color]}
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="sr-only"
                aria-label={`Show ${label} zones`}
            />
            <span
                className="text-xs font-mono transition-opacity"
                style={{
                    color: checked ? accentHex : "#64748b",
                }}
            >
                {label}
            </span>
        </label>
    );
}

// ─── Filter Panel ─────────────────────────────────────────────────────────────

export default function FilterPanel({ filters, onChange }: FilterPanelProps) {
    function update(partial: Partial<MapFilter>) {
        onChange({ ...filters, ...partial });
    }

    return (
        <div
            className="absolute bottom-6 left-4 z-[1000] p-4 rounded-xl w-52"
            style={{
                background: "rgba(10,15,30,0.92)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            }}
        >
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-3">
                Layer Filters
            </p>

            <div className="space-y-2.5 mb-4">
                <ColorToggle
                    color="red"
                    label="Critical (75–100)"
                    checked={filters.showRed}
                    accentHex="#C62828"
                    onChange={(v) => update({ showRed: v })}
                />
                <ColorToggle
                    color="amber"
                    label="Elevated (40–74)"
                    checked={filters.showAmber}
                    accentHex="#F59E0B"
                    onChange={(v) => update({ showAmber: v })}
                />
                <ColorToggle
                    color="green"
                    label="Stable (0–39)"
                    checked={filters.showGreen}
                    accentHex="#16A34A"
                    onChange={(v) => update({ showGreen: v })}
                />
            </div>

            <div className="border-t border-white/5 pt-3">
                <label
                    htmlFor="filter-credible"
                    className="flex items-center gap-2 cursor-pointer"
                >
                    <div
                        className={`w-8 h-4 rounded-full transition-colors relative flex-shrink-0 ${filters.credibilityOnly ? "bg-emerald-600" : "bg-white/10"
                            }`}
                    >
                        <div
                            className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${filters.credibilityOnly ? "translate-x-4" : "translate-x-0.5"
                                }`}
                        />
                    </div>
                    <input
                        id="filter-credible"
                        type="checkbox"
                        checked={filters.credibilityOnly}
                        onChange={(e) => update({ credibilityOnly: e.target.checked })}
                        className="sr-only"
                        aria-label="Show credible sources only"
                    />
                    <span className="flex items-center gap-1 text-xs text-slate-400 font-mono">
                        <Shield size={10} className="text-emerald-500" />
                        Verified only
                    </span>
                </label>
            </div>

            {/* Legend */}
            <div className="mt-4 border-t border-white/5 pt-3">
                <p className="text-[10px] font-mono text-slate-600 uppercase tracking-widest mb-2">
                    Legend
                </p>
                <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <div className="w-4 h-0.5 bg-slate-500 rounded" />
                        Circle size = article volume
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                        <div className="w-2 h-2 rounded-full bg-red-600 ring-1 ring-red-500 ring-offset-1 ring-offset-black animate-pulse" />
                        Pulse = statistical hotspot
                    </div>
                </div>
            </div>
        </div>
    );
}
