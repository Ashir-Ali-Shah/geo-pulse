// Directive telling Next.js to render this component strictly on the client side
"use client";

// Import several SVG icons from the lucide-react library to be used in the header UI
import { Activity, Satellite, Database, RefreshCw } from "lucide-react";
// Import the useState hook from React to manage component-level state variables
import { useState } from "react";

/**
 * Props for the Header component.
 *
 * @property onSync     - Optional callback invoked after a successful sync
 *                        completes, allowing the parent to refresh map data.
 * @property isSyncing  - When true, disables the sync button and switches the
 *                        live indicator to a purple "SYNCING" state.
 * @property dataSource - Indicates the active data source ("mongodb" | other).
 *                        Drives the label shown in the data-source badge.
 */
// Define the TypeScript interface mapping out expected properties passed to this component
interface HeaderProps {
    // Optional function reference triggered upon completion of synchronous background tasks
    onSync?: () => void;
    // Optional boolean flag overriding button state during active API or database communication
    isSyncing?: boolean;
    // Optional string metric indicating backend retrieval mechanism presently active
    dataSource?: string;
}

/**
 * Header Component
 *
 * A fixed-height application header rendered at the top of the map page.
 * Responsibilities:
 *  - Displays the GeoPulse brand logo and tagline.
 *  - Shows the current data source (MongoDB cache vs. Live API).
 *  - Provides a "Sync Now" button that POSTs to /api/sync and surfaces
 *    the result (zones synced, partial failure, or error) as a transient
 *    toast-style badge.
 *  - Shows a live/syncing status indicator that reacts to `isSyncing`.
 *
 * @param {HeaderProps} props
 * @returns {JSX.Element}
 */
// Export the main default React component describing the Header layout structure
export default function Header({
    // Destructure the onSync callback function passed down from the parent map view
    onSync,
    // Destructure the syncing state flag while providing a safe default boolean value
    isSyncing = false,
    // Destructure the literal data source string reference from properties
    dataSource,
// Map the destructured payload explicitly against the defined HeaderProps interface
}: HeaderProps) {
    /**
     * Transient status message shown next to the sync button after an attempt.
     * Auto-clears after 3–4 seconds via setTimeout. Null when idle.
     */
    // Declare reactive state variables managing temporary feedback messages shown near controls
    const [syncMsg, setSyncMsg] = useState<string | null>(null);

    /**
     * handleSync
     *
     * Fires when the user clicks "Sync Now". Calls the inline sync endpoint
     * (/api/sync?inline=1) which fetches fresh articles from newsdata.io,
     * computes conflict scores, and writes results to MongoDB.
     *
     * Response shapes handled:
     *  - { status: "complete", zonesComputed }  → green tick + zone count
     *  - { status: "partial",  zonesComputed, queriesFailed } → warning + failure count
     *  - any other status                        → generic "Sync started" message
     *  - network / parse error                   → "Sync error" message
     *
     * The `onSync` parent callback is invoked on success so the map can
     * re-fetch the updated zone data.
     */
    // Define an asynchronous function mediating interaction between frontend buttons and backend sync systems
    async function handleSync() {
        // Prevent concurrent syncs while one is already in flight
        // Halt method execution if a previously initiated synchronization run hasn't successfully resolved yet
        if (isSyncing) return;

        // Immediately update visual UI state declaring initiation of targeted background process flow
        setSyncMsg("Starting sync…");

        // Open structural try-block guarding against unhandled frontend network exceptions
        try {
            // Execute non-blocking fetch calling immediate background server execution with inline parameter flag
            const res = await fetch("/api/sync?inline=1", { method: "POST" });
            // Parse resolved backend instruction response directly extracting standard JSON payload
            const data = await res.json();

            // Build a human-readable result message based on the API response status
            // Variable to conditionally format the appropriate resultant status string
            const msg =
                // Check if background systems asserted perfect 100% successful execution
                data.status === "complete"
                    // Return clean checked string citing absolute number of records merged cleanly
                    ? `✓ ${data.zonesComputed} zones synced`
                    // Check alternatively if systems reported partial failures / restricted rate limit problems
                    : data.status === "partial"
                        // Return warning string detailing explicit volume totals highlighting partial gaps
                        ? `⚠ ${data.zonesComputed} zones (${data.queriesFailed?.length} failed)`
                        // Fallback generic catch-all messaging if response format unexpectedly altered
                        : "Sync started";

            // Push the generated dynamic string physically onto the user interface notification layer
            setSyncMsg(msg);

            // Auto-dismiss the message after 4 seconds
            // Trigger temporary timeout function destroying the active visual alert once timer elapses
            setTimeout(() => setSyncMsg(null), 4000);

            // Notify parent so it can refresh map data
            // Verify if parent provided a valid reload callback reference
            if (onSync) onSync();
        // Catch network structural failures bypassing HTTP parsing layers
        } catch {
            // Surface a generic error message and clear it after 3 seconds
            // Set simple string describing complete structural network failure
            setSyncMsg("Sync error");
            // Setup timeout erasing failure string after designated wait duration finishes
            setTimeout(() => setSyncMsg(null), 3000);
        }
    }

    // Return primary component JSX structure representation
    return (
        /* Header bar — dark frosted-glass background with a subtle blue-tinted bottom border to visually separate it from the map canvas below. */
        <header
            className="flex items-center justify-between px-5 h-14 flex-shrink-0"
            style={{
                background:
                    "linear-gradient(90deg, rgba(8,12,24,0.98) 0%, rgba(12,18,35,0.98) 100%)",
                borderBottom: "1px solid rgba(59,130,246,0.15)",
                backdropFilter: "blur(20px)",
            }}
        >
            {/* ── Brand Logo ──────────────────────────────────────────────────────
                Gradient icon square (blue→purple) + two-line wordmark.
                "GEO" is white; "PULSE" is blue-400 for visual contrast.
            ────────────────────────────────────────────────────────────────────── */}
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
                    {/* Primary wordmark */}
                    <h1 className="text-sm font-black tracking-tight text-white font-mono">
                        GEO<span className="text-blue-400">PULSE</span>
                    </h1>
                    {/* Sub-tagline — very small, slate, all-caps */}
                    <p className="text-[9px] text-slate-600 font-mono tracking-widest uppercase">
                        Global Conflict Predictor
                    </p>
                </div>
            </div>

            {/* ── Right-side Controls ──────────────────────────────────────────────
                Laid out left-to-right:
                  1. Transient sync result message (only visible after a sync attempt)
                  2. Data source badge (hidden on mobile)
                  3. Sync Now button
                  4. Live / Syncing status pill
                  5. newsdata.io attribution (hidden on mobile)
            ────────────────────────────────────────────────────────────────────── */}
            <div className="flex items-center gap-2">

                {/* Sync result toast — conditionally rendered; fades out via setTimeout */}
                {syncMsg && (
                    <span className="text-[10px] font-mono text-blue-400 bg-blue-950/50 border border-blue-800/40 rounded-full px-3 py-1">
                        {syncMsg}
                    </span>
                )}

                {/* Data source badge — shows "MongoDB cache" or "Live API".
                    Hidden on small screens to preserve header space. */}
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

                {/* Sync Now button — disabled while a sync is in progress.
                    The RefreshCw icon spins (animate-spin) during active syncing.
                    On mobile only the icon is shown; the label is hidden. */}
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
                    {/* Icon spins while syncing to provide kinetic feedback */}
                    <RefreshCw
                        size={11}
                        className={isSyncing ? "animate-spin" : ""}
                    />
                    {/* Label hidden on mobile to keep the header compact */}
                    <span className="hidden sm:inline">
                        {isSyncing ? "Syncing…" : "Sync Now"}
                    </span>
                </button>

                {/* Live / Syncing status pill ─────────────────────────────────────
                    • Idle:    green pulsing dot  + "LIVE"
                    • Syncing: purple pulsing dot + "SYNCING"
                    Color values swap based on the `isSyncing` prop.
                ─────────────────────────────────────────────────────────────────── */}
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

                {/* Data provider attribution — hidden on mobile */}
                <div className="hidden sm:flex items-center gap-1.5 text-slate-600">
                    <Activity size={12} />
                    <span className="text-[10px] font-mono">newsdata.io</span>
                </div>
            </div>
        </header>
    );
}