// Import Metadata type from Next.js for defining the page metadata structure
import type { Metadata } from "next";
// Import Google fonts Space Grotesk and JetBrains Mono from the Next.js font optimization package
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
// Import the global CSS file that contains Tailwind directives and other global styles
import "./globals.css";

// Initialize the Space Grotesk font with specific configurations
const spaceGrotesk = Space_Grotesk({
  // Load only the Latin subset to reduce font payload size
  subsets: ["latin"],
  // Assign a custom CSS variable name for this font to be used in Tailwind/CSS
  variable: "--font-sans",
  // Use 'swap' display strategy to show fallback text immediately until the font loads
  display: "swap",
});

// Initialize the JetBrains Mono font with specific configurations
const jetbrainsMono = JetBrains_Mono({
  // Load only the Latin subset to reduce font payload size
  subsets: ["latin"],
  // Assign a custom CSS variable name for this font to be used in Tailwind/CSS
  variable: "--font-mono",
  // Use 'swap' display strategy to show fallback text immediately until the font loads
  display: "swap",
});

/**
 * Site Metadata
 *
 * Configures the global SEO metadata, page title, description, and OpenGraph
 * details used across the GeoPulse Predictor application.
 */
// Export the metadata object which Next.js will use to generate <head> tags
export const metadata: Metadata = {
  // The primary title of the website
  title: "GeoPulse Predictor — Global Conflict Intelligence",
  // The description of the site used by search engines
  description:
    "Real-time geospatial conflict tracking powered by newsdata.io. Monitor global hotspots, conflict intensity scores, and economic impact on commodity markets.",
  // Keywords used for SEO categorization
  keywords: [
    // Keyword 1
    "conflict tracker",
    // Keyword 2
    "geospatial news",
    // Keyword 3
    "risk analytics",
    // Keyword 4
    "global events",
    // Keyword 5
    "commodity impact",
  ],
  // OpenGraph metadata used when sharing the link on social media platforms
  openGraph: {
    // The OpenGraph title for social media sharing
    title: "GeoPulse Predictor",
    // The OpenGraph description for social media previews
    description: "Real-time global conflict intelligence platform",
    // The OpenGraph type defining this as a general website
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
// Define and export the root layout component that wraps all pages
export default function RootLayout({
  // Destructure the children prop from the arguments
  children,
// Define the TypeScript type for the props, specifying children as React nodes
}: {
  // The children nodes that will be rendered inside the layout
  children: React.ReactNode;
}) {
  // Return the main HTML structure of the application
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      {/* Render the <body> tag with the standard antialiased utility class for smoother text rendering */}
      <body className="antialiased">
        {/* Inject and render the child components (actual page content) here */}
        {children}
      </body>
    </html>
  );
}
