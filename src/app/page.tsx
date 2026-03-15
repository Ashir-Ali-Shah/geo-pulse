// Import the Next.js Link component for client-side routing between pages
import Link from "next/link";
// Import several SVG icons from the lucide-react library to be used in the UI
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
// Define and export the default functional component LandingPage
export default function LandingPage() {
  /**
   * Feature card definitions for the grid section.
   * Each entry contains:
   * - icon: A lucide-react icon component rendered inside the card.
   * - title: Short feature name displayed as the card heading.
   * - desc: One-sentence description of the feature.
   * - color: Hex accent color applied to the icon and its background tint.
   */
  // Declare an array of objects to store the details for the features section
  const features = [
    // Feature 1: Global Heatmap configuration
    {
      // Assign the Globe icon
      icon: Globe,
      // The heading title for this feature
      title: "Global Heatmap",
      // The description explaining the heatmap
      desc: "Live conflict intensity visualized as color-coded circles across 50+ countries.",
      // A primary color used for this feature's styling (blue)
      color: "#3b82f6",
    },
    // Feature 2: Z-Score Pulse Detection configuration
    {
      // Assign the Activity icon
      icon: Activity,
      // The heading title for this feature
      title: "Z-Score Pulse Detection",
      // The description explaining statistical detection
      desc: "Statistical outlier detection triggers animated hotspot alerts for breaking events.",
      // A primary color used for this feature's styling (red)
      color: "#C62828",
    },
    // Feature 3: Credibility Filter configuration
    {
      // Assign the Shield icon
      icon: Shield,
      // The heading title for this feature
      title: "Credibility Filter",
      // The description explaining the source filtering
      desc: "Show only verified sources: Reuters, AP News, BBC, and Al Jazeera.",
      // A primary color used for this feature's styling (green)
      color: "#16a34a",
    },
    // Feature 4: Wallet Impact configuration
    {
      // Assign the Zap icon
      icon: Zap,
      // The heading title for this feature
      title: "Wallet Impact",
      // The description explaining the economic tracking
      desc: "Click any zone to see affected commodity markets: Oil, Wheat, Gas, and more.",
      // A primary color used for this feature's styling (amber)
      color: "#F59E0B",
    },
  ];

  // Return the main JSX structure for the landing page component
  // Root container — full-viewport dark background with a subtle blue radial
  // glow at the top center to give depth to the hero section.
  // Define the main container as a flex column spanning at least the viewport height
  return (
    <main
      className="min-h-screen flex flex-col"
      style={{
        // Set a complex radial gradient background combined with a solid dark blue color
        background:
          "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(30,58,138,0.4) 0%, transparent 70%), #050810",
      }}
    >
      {/* ─── Navigation Bar ───────────────────────────────────────────────────
          Left: brand logo + wordmark.
          Right: text link that routes the user directly to the /map page.
      ──────────────────────────────────────────────────────────────────────── */}
      {/* Declare a navigation bar spanning the full width with padding and borders */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/5">
        {/* Brand logo container — holds the gradient square icon and the GEOPULSE text */}
        <div className="flex items-center gap-3">
          {/* Create the gradient square background for the brand icon */}
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              // Apply a diagonal linear gradient
              background: "linear-gradient(135deg, #1d4ed8 0%, #6d28d9 100%)",
              // Apply a glowing drop shadow matching the brand colors
              boxShadow: "0 0 20px rgba(99,102,241,0.5)",
            }}
          >
            {/* Render the Satellite icon in white inside the gradient square */}
            <Satellite size={16} className="text-white" />
          </div>
          {/* Display the brand logotype, formatting "GEO" in white and "PULSE" in blue */ }
          <span className="text-white font-black font-mono text-sm tracking-tight">
            {/* "GEO" part of the name */}
            GEO
            {/* "PULSE" part of the name formatted differently */}
            <span className="text-blue-400">PULSE</span>
          </span>
        </div>

        {/* Top-right navigation link — a secondary CTA that functions identically to the hero button */}
        <Link
          // Destination URL
          href="/map"
          // Link styling: aligned to center, small text, subtle hover color transition
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors font-mono"
        >
          {/* Link text */}
          Launch App
          {/* Small ArrowRight icon placed next to the link text */}
          <ArrowRight size={14} />
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
      {/* Container for the Hero section: flex-1 to fill space, centered content, specific padding */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24">
        {/* Live data source badge — displays a pulsing dot alongside a label indicating the data source */}
        <div className="flex items-center gap-2 mb-6 bg-blue-950/50 border border-blue-800/40 rounded-full px-4 py-1.5">
          {/* The pulsing indicator dot styled in blue */}
          <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
          {/* The text indicating what powers this application */}
          <span className="text-xs font-mono text-blue-400 tracking-widest">
            POWERED BY NEWSDATA.IO
          </span>
        </div>

        {/* The primary hero headline, taking up significant screen real estate */}
        <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
          {/* First part of the headline text */}
          The World&apos;s Conflicts,{" "}
          {/* Insert a line break for layout */}
          <br />
          {/* Contains the gradient-styled text portion of the headline */}
          <span
            style={{
              // Set the text color to transparent and use a background gradient clip
              backgroundImage:
                "linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)",
              // Clip the background to the text (WebKit)
              WebkitBackgroundClip: "text",
              // Use the background behind the clipped text as the fill (WebKit)
              WebkitTextFillColor: "transparent",
            }}
          >
            {/* The actual text content to receive the gradient fill */}
            In Real Time.
          </span>
        </h1>

        {/* Subtitle paragraph providing descriptive context for the application */}
        <p className="text-slate-400 text-lg max-w-2xl leading-relaxed mb-10 font-mono">
          {/* Text content describing the platform's utility */}
          GeoPulse Predictor maps global news events to an interactive heatmap,
          scores conflict intensity, and shows the economic ripple effect on
          commodity markets — all in one Command Center.
        </p>

        {/* Container for call-to-action buttons (currently holds just the primary CTA) */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Primary Call-to-Action Link rendering as a stylized button */}
          <Link
            // Destination path
            href="/map"
            // Ensure Cypress/Playwright identifier exists, although not explicitly required here
            id="cta-launch-button"
            // Styling classes providing padding, borders, color transition, hover scaling effects
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-white text-sm font-mono transition-all hover:scale-105"
            style={{
              // Specific linear gradient background
              background: "linear-gradient(135deg, #1d4ed8, #6d28d9)",
              // Specific outer glow shadow to make the button stand out
              boxShadow: "0 0 30px rgba(99,102,241,0.4)",
            }}
          >
            {/* Satellite icon shown inside the CTA button */}
            <Satellite size={16} />
            {/* Text for the primary CTA button */}
            Launch GeoPulse
            {/* ArrowRight icon shown inside the CTA button */}
            <ArrowRight size={16} />
          </Link>
        </div>

        {/* ── Conflict Intensity Legend ────────────────────────────────────────
            Three color-coded tiers that correspond to the heatmap circles:
              • Red   — Critical  (score ≥ 75)
              • Amber — Elevated  (score 40–74)
              • Green — Stable    (score < 40)
        ───────────────────────────────────────────────────────────────────── */}
        {/* Container for the UI Legend explaining the map's coloring schema */}
        <div className="flex items-center gap-6 mt-12 text-xs font-mono text-slate-500">
          {/* Iterate over an array defining the three separate tiers in the legend */}
          {[
            // Definition of the Critical status tier
            { color: "#C62828", label: "Critical (75+)" },
            // Definition of the Elevated status tier
            { color: "#F59E0B", label: "Elevated (40–74)" },
            // Definition of the Stable status tier
            { color: "#16A34A", label: "Stable (<40)" },
            // Map the defined tiers into React DOM nodes
          ].map(({ color, label }) => (
            /* Each legend item comprises a parent div wrapping a colored dot and its corresponding label */
            <div key={label} className="flex items-center gap-2">
              {/* Colored dot defining the tier */}
              <div
                // Define the physical dimensions and roundness mapping it to a circle
                className="w-3 h-3 rounded-full"
                // Apply the tier's color inline
                style={{ background: color }}
              />
              {/* Render the label string for the currently mapped tier */}
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
      {/* Wrapper section for the feature grid controlling padding and max width constraint */}
      <section className="px-8 pb-20 max-w-5xl mx-auto w-full">
        {/* Container dictating the grid layout styling logic across differing viewports */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Iterate over the features configuration array declared near the top of component */}
          {features.map(({ icon: Icon, title, desc, color }) => (
            /* Root div representing the individual feature card, utilizing a blurred glassy backdrop component */
            <div
              // Apply unique key parameter using the title for React list rendering
              key={title}
              // Standard padding and corner radius application for structure
              className="p-6 rounded-xl"
              style={{
                // Explicit inline style setting the light transparent overlay
                background: "rgba(255,255,255,0.03)",
                // Subtly lighter border emphasizing the translucent card design
                border: "1px solid rgba(255,255,255,0.07)",
                // The backdrop blur handling the true 'glassmorphism' aesthetic
                backdropFilter: "blur(10px)",
              }}
            >
              {/* Wrapping container for the assigned feature icon highlighting its specific primary color */}
              <div
                // Structural classes handling dimensions, layout arrangement inside the container
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                // Applying inline style for background coloration leveraging a 20% opacity trick (e.g. hex #color + "20")
                style={{ background: `${color}20` }}
              >
                {/* Mount the destructured lucide-react corresponding to the feature utilizing its designated color */}
                <Icon size={20} style={{ color }} />
              </div>

              {/* A simple subheading stating the name of the feature */}
              <h3 className="text-white font-bold mb-2">{title}</h3>

              {/* Detailed sentence describing its utilization in user facing terminology */}
              <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────────────────
          Left:  tech stack attribution (Next.js 14 + newsdata.io).
          Right: financial disclaimer required for any market-data product.
      ──────────────────────────────────────────────────────────────────────── */}
      {/* Global application footer component spanning out to maximum extents on the bottom edge */}
      <footer className="border-t border-white/5 px-8 py-6 flex items-center justify-between">
        {/* Container span presenting project/tech stack metadata to the end user */}
        <span className="text-xs font-mono text-slate-700">
          GeoPulse Predictor — Built with Next.js 14 · newsdata.io
        </span>

        {/* Critical regulatory wording shielding service creation operators from strict liability expectations */}
        <span className="text-xs font-mono text-slate-700">
          Not financial advice
        </span>
      </footer>
    </main>
  );
}