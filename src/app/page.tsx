import Link from "next/link";
import { Satellite, Activity, Shield, Globe, ArrowRight, Zap } from "lucide-react";

/**
 * LandingPage Component
 *
 * This is the application's root landing page. It provides a brief overview
 * of the GeoPulse Predictor's features (Global Heatmap, Z-Score Pulse Detection,
 * Credibility Filter, and Wallet Impact) and serves as an entry point to the
 * interactive map application.
 *
 * @returns {JSX.Element} The rendered landing page UI.
 */
export default function LandingPage() {
  /**
   * Feature card definitions for the grid section.
   * Each entry contains:
   * - icon: A lucide-react icon component rendered inside the card.
   * - title: Short feature name displayed as the card heading.
   * - desc: One-sentence description of the feature.
   * - color: Hex accent color applied to the icon and its background tint.
   */
  const features = [
    {
      icon: Globe,
      title: "Global Heatmap",
      desc: "Live conflict intensity visualized as color-coded circles across 50+ countries.",
      color: "#3b82f6",
    },
    {
      icon: Activity,
      title: "Z-Score Pulse Detection",
      desc: "Statistical outlier detection triggers animated hotspot alerts for breaking events.",
      color: "#C62828",
    },
    {
      icon: Shield,
      title: "Credibility Filter",
      desc: "Show only verified sources: Reuters, AP News, BBC, and Al Jazeera.",
      color: "#16a34a",
    },
    {
      icon: Zap,
      title: "Wallet Impact",
      desc: "Click any zone to see affected commodity markets: Oil, Wheat, Gas, and more.",
      color: "#F59E0B",
    },
  ];

  return (
    /**
     * Root container — full-viewport dark background with a subtle blue radial
     * glow at the top center to give depth to the hero section.
     */
    <main
      className="min-h-screen flex flex-col"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(30,58,138,0.4) 0%, transparent 70%), #050810",
      }}
    >
      {/* ─── Navigation Bar ───────────────────────────────────────────────────
          Left: brand logo + wordmark.
          Right: text link that routes the user directly to the /map page.
      ──────────────────────────────────────────────────────────────────────── */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        {/* Brand logo — gradient square icon paired with the GEOPULSE wordmark */}
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #1d4ed8 0%, #6d28d9 100%)",
              boxShadow: "0 0 20px rgba(99,102,241,0.5)",
            }}
          >
            <Satellite size={16} className="text-white" />
          </div>
          {/* "GEO" in white, "PULSE" in blue-400 for visual contrast */}
          <span className="text-white font-black font-mono text-sm tracking-tight">
            GEO<span className="text-blue-400">PULSE</span>
          </span>
        </div>

        {/* Top-right navigation link — secondary CTA that mirrors the hero button */}
        <Link
          href="/map"
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors font-mono"
        >
          Launch App <ArrowRight size={14} />
        </Link>
      </nav>

      {/* ─── Hero Section ─────────────────────────────────────────────────────
          Centered layout with:
            1. "LIVE" badge indicating the real-time data source.
            2. Main headline with gradient-colored accent text.
            3. Subheading describing the product in plain language.
            4. Primary CTA button routing to /map.
            5. Color legend explaining the three conflict-intensity tiers.
      ──────────────────────────────────────────────────────────────────────── */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24">
        {/* Live data source badge — pulsing dot signals real-time updates */}
        <div className="flex items-center gap-2 mb-6 bg-blue-950/50 border border-blue-800/40 rounded-full px-4 py-1.5">
          <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
          <span className="text-xs font-mono text-blue-400 tracking-widest">
            POWERED BY NEWSDATA.IO
          </span>
        </div>

        {/* Main headline — second line uses a blue→purple→pink gradient fill */}
        <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
          The World&apos;s Conflicts,{" "}
          <br />
          <span
            style={{
              backgroundImage:
                "linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            In Real Time.
          </span>
        </h1>

        {/* Product description — concise summary of core value propositions */}
        <p className="text-slate-400 text-lg max-w-2xl leading-relaxed mb-10 font-mono">
          GeoPulse Predictor maps global news events to an interactive heatmap,
          scores conflict intensity, and shows the economic ripple effect on
          commodity markets — all in one Command Center.
        </p>

        {/* CTA button group — currently only one primary action */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Primary CTA — indigo/purple gradient with glow, scales on hover */}
          <Link
            href="/map"
            id="cta-launch-button"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-white text-sm font-mono transition-all hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #1d4ed8, #6d28d9)",
              boxShadow: "0 0 30px rgba(99,102,241,0.4)",
            }}
          >
            <Satellite size={16} />
            Launch GeoPulse
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* ── Conflict Intensity Legend ────────────────────────────────────────
            Three color-coded tiers that correspond to the heatmap circles:
              • Red   — Critical  (score ≥ 75)
              • Amber — Elevated  (score 40–74)
              • Green — Stable    (score < 40)
        ───────────────────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-6 mt-12 text-xs font-mono text-slate-500">
          {[
            { color: "#C62828", label: "Critical (75+)" },
            { color: "#F59E0B", label: "Elevated (40–74)" },
            { color: "#16A34A", label: "Stable (<40)" },
          ].map(({ color, label }) => (
            /* Each legend item: colored dot + intensity tier label */
            <div key={label} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: color }}
              />
              {label}
            </div>
          ))}
        </div>
      </section>

      {/* ─── Features Grid ────────────────────────────────────────────────────
          2-column (desktop) / 1-column (mobile) grid of feature cards.
          Each card is rendered from the `features` array defined above and
          uses a frosted-glass treatment (low-opacity background + blur border).
      ──────────────────────────────────────────────────────────────────────── */}
      <section className="px-8 pb-20 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map(({ icon: Icon, title, desc, color }) => (
            /* Feature card — frosted glass panel with colored icon accent */
            <div
              key={title}
              className="p-6 rounded-xl"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                backdropFilter: "blur(10px)",
              }}
            >
              {/* Icon container — uses a 12% opacity tint of the feature's accent color */}
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                style={{ background: `${color}20` }}
              >
                <Icon size={20} style={{ color }} />
              </div>

              {/* Card heading */}
              <h3 className="text-white font-bold mb-2">{title}</h3>

              {/* Card body copy */}
              <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────────────────
          Left:  tech stack attribution (Next.js 14 + newsdata.io).
          Right: financial disclaimer required for any market-data product.
      ──────────────────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 px-8 py-6 flex items-center justify-between">
        {/* Build attribution */}
        <span className="text-xs font-mono text-slate-700">
          GeoPulse Predictor — Built with Next.js 14 · newsdata.io
        </span>

        {/* Liability disclaimer */}
        <span className="text-xs font-mono text-slate-700">
          Not financial advice
        </span>
      </footer>
    </main>
  );
}