import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

/**
 * Site Metadata
 * 
 * Configures the global SEO metadata, page title, description, and OpenGraph 
 * details used across the GeoPulse Predictor application.
 */
export const metadata: Metadata = {
  title: "GeoPulse Predictor — Global Conflict Intelligence",
  description:
    "Real-time geospatial conflict tracking powered by newsdata.io. Monitor global hotspots, conflict intensity scores, and economic impact on commodity markets.",
  keywords: [
    "conflict tracker",
    "geospatial news",
    "risk analytics",
    "global events",
    "commodity impact",
  ],
  openGraph: {
    title: "GeoPulse Predictor",
    description: "Real-time global conflict intelligence platform",
    type: "website",
  },
};

/**
 * Root Layout Component
 * 
 * Provides the core HTML structure for the Next.js App Router.
 * Configures global typography (Space Grotesk and JetBrains Mono)
 * and sets up basic anti-aliased styling for the `<body>`.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children The page components to render within the layout.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
