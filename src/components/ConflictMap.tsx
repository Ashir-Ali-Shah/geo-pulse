"use client";

import { useMemo } from "react";
import {
    MapContainer,
    TileLayer,
    CircleMarker,
    Tooltip,
    useMap,
} from "react-leaflet";
import { ConflictEvent, MapFilter } from "@/types";
import { CONFLICT_COLORS } from "@/lib/constants";
import "leaflet/dist/leaflet.css";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConflictMapProps {
    events: ConflictEvent[];
    filters: MapFilter;
    onEventClick: (event: ConflictEvent) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getMarkerRadius(mentionCount: number): number {
    // Scale from min 6 to max 28 based on mention count (capped at 50)
    const clamped = Math.min(mentionCount, 50);
    return 6 + (clamped / 50) * 22;
}

function getMarkerOpacity(color: ConflictEvent["color"]): number {
    if (color === "red") return 0.85;
    if (color === "amber") return 0.7;
    return 0.55;
}

function isVisible(event: ConflictEvent, filters: MapFilter): boolean {
    if (!filters.showRed && event.color === "red") return false;
    if (!filters.showAmber && event.color === "amber") return false;
    if (!filters.showGreen && event.color === "green") return false;
    if (event.conflictScore < filters.minScore) return false;
    return true;
}

// ─── Pulse overlay (SVG CSS animation injected into leaflet pane) ─────────────

function PulseStyle() {
    return (
        <style>{`
      @keyframes geopulse {
        0%   { transform: scale(1);   opacity: 0.9; }
        50%  { transform: scale(1.6); opacity: 0.4; }
        100% { transform: scale(1);   opacity: 0.9; }
      }
      .geopulse-ring {
        animation: geopulse 2s ease-in-out infinite;
        transform-origin: center;
      }
    `}</style>
    );
}

// ─── Map Component ────────────────────────────────────────────────────────────

export default function ConflictMap({
    events,
    filters,
    onEventClick,
}: ConflictMapProps) {
    const visibleEvents = useMemo(
        () => events.filter((e) => isVisible(e, filters)),
        [events, filters]
    );

    return (
        <div className="relative w-full h-full">
            <PulseStyle />
            <MapContainer
                center={[20, 10]}
                zoom={2.5}
                minZoom={2}
                maxZoom={10}
                className="w-full h-full"
                style={{ background: "#0a0f1e" }}
                zoomControl={false}
                attributionControl={false}
            >
                {/* Dark mode tile layer */}
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://carto.com">CARTO</a>'
                    subdomains="abcd"
                />

                {visibleEvents.map((event) => {
                    const color = CONFLICT_COLORS[event.color];
                    const radius = getMarkerRadius(event.mentionCount);
                    const fillOpacity = getMarkerOpacity(event.color);

                    return (
                        <ConflictMarker
                            key={event.id}
                            event={event}
                            color={color}
                            radius={radius}
                            fillOpacity={fillOpacity}
                            onClick={() => onEventClick(event)}
                        />
                    );
                })}
            </MapContainer>
        </div>
    );
}

// ─── Individual Marker ────────────────────────────────────────────────────────

interface MarkerProps {
    event: ConflictEvent;
    color: string;
    radius: number;
    fillOpacity: number;
    onClick: () => void;
}

function ConflictMarker({
    event,
    color,
    radius,
    fillOpacity,
    onClick,
}: MarkerProps) {
    return (
        <>
            {/* Outer pulse ring for hotspots */}
            {event.isPulsing && (
                <CircleMarker
                    center={[event.lat, event.lng]}
                    radius={radius * 2.2}
                    pathOptions={{
                        color,
                        weight: 1.5,
                        opacity: 0.5,
                        fillOpacity: 0,
                        className: "geopulse-ring",
                    }}
                    interactive={false}
                />
            )}

            {/* Main marker */}
            <CircleMarker
                center={[event.lat, event.lng]}
                radius={radius}
                pathOptions={{
                    color,
                    weight: event.color === "red" ? 2 : 1,
                    opacity: 0.9,
                    fillColor: color,
                    fillOpacity,
                }}
                eventHandlers={{ click: onClick }}
            >
                <Tooltip
                    permanent={false}
                    direction="top"
                    className="conflict-tooltip"
                    sticky
                >
                    <div className="text-xs font-mono">
                        <div className="font-bold text-sm mb-1">{event.country}</div>
                        <div>
                            Conflict Score:{" "}
                            <span
                                style={{ color }}
                                className="font-bold"
                            >
                                {event.conflictScore}
                            </span>
                        </div>
                        <div>{event.mentionCount} articles</div>
                        {event.isPulsing && (
                            <div className="mt-1 text-red-400 font-bold">⚡ HOTSPOT</div>
                        )}
                    </div>
                </Tooltip>
            </CircleMarker>
        </>
    );
}
