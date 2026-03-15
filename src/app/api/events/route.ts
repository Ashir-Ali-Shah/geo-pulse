/**
 * app/api/events/route.ts
 *
 * Serves pre-computed conflict zones from MongoDB.
 * Falls back to a direct newsdata.io fetch if MongoDB has no data yet.
 *
 * This design means:
 *   - Zero rate-limit risk at read time
 *   - Data is always fresh (synced independently via /api/sync)
 *   - Fast response times (MongoDB read << API call)
 */

// Import NextResponse used to build and return JSON responses in Next.js API routes
import { NextResponse } from "next/server";
// Import database helper functions: ensureIndexes for setting up DB indexes and getConflictZones for reading events
import {
    // Function to ensure MongoDB indexes are created for performance
    ensureIndexes,
    // Function to retrieve the latest conflict zones data from MongoDB
    getConflictZones,
} from "@/lib/db/articleRepository";
// Import the newsService fallback function to fetch direct news when the database is empty
import { fetchConflictNews } from "@/lib/newsService";
// Import data processing algorithms
import {
    // Function to aggregate raw articles into unique geographical conflict events
    aggregateArticlesToEvents,
    // Function to compute aggregate statistical metrics (e.g. total events, risk scores)
    computeGlobalStats,
} from "@/lib/dataProcessor";
// Import type definitions for the expected API response shape
import { GdeltApiResponse } from "@/types";

// Force the API route to execute dynamically at runtime instead of being statically generated
export const dynamic = "force-dynamic";

// Define the asynchronous GET handler for this API endpoint
export async function GET() {
    // Start a try-catch block to handle potential errors during database or external service calls
    try {
        // Ensure that MongoDB has the required indexes on relevant collections; wait for it to finish
        await ensureIndexes();

        // 1. Try to serve from MongoDB first
        // Query the database for the current events array, computed global stats, and the timestamp of computation
        const { events, stats, computedAt } = await getConflictZones();

        // Check if the database returned any events (meaning the database is not empty)
        if (events.length > 0) {
            // Construct the standardized API response object using the retrieved data
            const response: GdeltApiResponse = {
                // Populate the events field with DB data
                events,
                // Populate the stats field with DB data
                stats,
                // Populate the fetchedAt field using the date the data was processed
                fetchedAt: computedAt,
            };
            // Send the JSON response to the client alongside custom HTTP caching headers
            return NextResponse.json(response, {
                // Define HTTP headers for the JSON response
                headers: {
                    // Set Cache-Control header to cache for 60s, allowing serving stale content while revalidating for another 120s
                    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
                    // Provide a custom header to inform the client that data was sourced from MongoDB
                    "X-Data-Source": "mongodb",
                },
            });
        }

        // 2. Fallback: direct newsdata.io fetch (when DB is empty on first run)
        // Log a warning message stating the standard MongoDB query yielded no results, moving to fallback fetch
        console.log("[/api/events] MongoDB empty — falling back to direct fetch");
        // Await the direct fetch results from the upstream news provider API
        const newsData = await fetchConflictNews();
        // Extract the article results; default to an empty array if the response is undefined
        const articles = newsData.results ?? [];
        // Run aggregation algorithm on the fetched articles to produce formatted event data
        const fallbackEvents = aggregateArticlesToEvents(articles);
        // Compute statistical metrics based on the newly generated fallback events and total source articles
        const fallbackStats = computeGlobalStats(fallbackEvents, articles.length);

        // Construct the fallback API response object using the processed fallback data
        const fallbackResponse: GdeltApiResponse = {
            // Populate events field with the dynamically generated fallback events
            events: fallbackEvents,
            // Populate stats field with the dynamically generated fallback stats
            stats: fallbackStats,
            // Capture and set the current timestamp indicating when this direct fetch occurred
            fetchedAt: new Date().toISOString(),
        };

        // Send the JSON response referencing the fallback payload to the client with caching headers
        return NextResponse.json(fallbackResponse, {
            // Define HTTP headers for the fallback response
            headers: {
                // Set Cache-Control header to cache the direct API fetch at the network edge for 60 seconds
                "Cache-Control": "public, s-maxage=60",
                // Provide a custom header to inform the client that data was sourced directly from newsdata.io
                "X-Data-Source": "newsdata-direct",
            },
        });
    // Catch any error that might occur during the try block execution
    } catch (error) {
        // Output the caught error details to the server console for debugging purposes
        console.error("[/api/events] Error:", error);
        // Send an error-handling JSON payload back to the client ensuring the app doesn't crash on the frontend
        return NextResponse.json(
            {
                // Convert the caught error to an Error object and extract its message string
                error: (error as Error).message,
                // Return an empty events array as a safe default
                events: [],
                // Return a dummy stats object with zeroed metrics as safe defaults
                stats: {
                    // Reset total events metric to 0
                    totalEvents: 0,
                    // Reset critical zones metric to 0
                    criticalZones: 0,
                    // Reset total articles metric to 0
                    totalArticles: 0,
                    // Reset highest conflict score to 0
                    highestConflictScore: 0,
                    // Reset mean mention count to 0
                    meanMentionCount: 0,
                    // Reset standard deviation of mentions to 0
                    stdDevMentionCount: 0,
                },
                // Capture the current timestamp to communicate when this error-response occurred
                fetchedAt: new Date().toISOString(),
            },
            // Specify a 500 Internal Server Error HTTP status code to denote failure
            { status: 500 }
        );
    }
}
