import Link from "next/link";
import { Satellite, Activity, Shield, Globe, ArrowRight, Zap } from "lucide-react";

export default function LandingPage() {
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
    <main
      className="min-h-screen flex flex-col"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(30,58,138,0.4) 0%, transparent 70%), #050810",
      }}
    >
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/5">
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
          <span className="text-white font-black font-mono text-sm tracking-tight">
            GEO<span className="text-blue-400">PULSE</span>
          </span>
        </div>
        <Link
          href="/map"
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors font-mono"
        >
          Launch App <ArrowRight size={14} />
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24">
        {/* Live badge */}
        <div className="flex items-center gap-2 mb-6 bg-blue-950/50 border border-blue-800/40 rounded-full px-4 py-1.5">
          <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
          <span className="text-xs font-mono text-blue-400 tracking-widest">
            POWERED BY NEWSDATA.IO
          </span>
        </div>

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

        <p className="text-slate-400 text-lg max-w-2xl leading-relaxed mb-10 font-mono">
          GeoPulse Predictor maps global news events to an interactive heatmap,
          scores conflict intensity, and shows the economic ripple effect on
          commodity markets — all in one Command Center.
        </p>

        <div className="flex flex-col sm:flex-row gap-4">
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

        {/* Color legend */}
        <div className="flex items-center gap-6 mt-12 text-xs font-mono text-slate-500">
          {[
            { color: "#C62828", label: "Critical (75+)" },
            { color: "#F59E0B", label: "Elevated (40–74)" },
            { color: "#16A34A", label: "Stable (<40)" },
          ].map(({ color, label }) => (
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

      {/* Features grid */}
      <section className="px-8 pb-20 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map(({ icon: Icon, title, desc, color }) => (
            <div
              key={title}
              className="p-6 rounded-xl"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                backdropFilter: "blur(10px)",
              }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center mb-4"
                style={{ background: `${color}20` }}
              >
                <Icon size={20} style={{ color }} />
              </div>
              <h3 className="text-white font-bold mb-2">{title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-8 py-6 flex items-center justify-between">
        <span className="text-xs font-mono text-slate-700">
          GeoPulse Predictor — Built with Next.js 14 · newsdata.io
        </span>
        <span className="text-xs font-mono text-slate-700">
          Not financial advice
        </span>
      </footer>
    </main>
  );
}
