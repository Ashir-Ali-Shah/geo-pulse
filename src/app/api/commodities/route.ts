/**
 * app/api/commodities/route.ts
 *
 * Returns commodity impact data for a given region.
 */

// Import NextRequest and NextResponse objects from Next.js for handling HTTP requests and responses
import { NextRequest, NextResponse } from "next/server";
// Import the getRegionImpact function from the commodityService library to fetch impact data
import { getRegionImpact } from "@/lib/commodityService";
// Import TypeScript types RegionKey and CommodityApiResponse for type safety
import { RegionKey, CommodityApiResponse } from "@/types";

// Force the route to be dynamic, meaning it will be evaluated at runtime for each request
export const dynamic = "force-dynamic";

// Define an array of valid region keys to validate incoming requests
const VALID_REGIONS: RegionKey[] = [
    // The Middle East region
    "middle_east",
    // The European region
    "europe",
    // The East Asian region
    "east_asia",
    // The South Asian region
    "south_asia",
    // The African region
    "africa",
    // The Latin American region
    "latin_america",
    // The North American region
    "north_america",
    // The Central Asian region
    "central_asia",
    // The Oceania region
    "oceania",
    // A fallback for an unknown region
    "unknown",
];

// Define the asynchronous GET handler for this API route
export async function GET(req: NextRequest) {
    // Parse the URL search parameters from the incoming request
    const { searchParams } = new URL(req.url);
    // Extract the 'region' parameter, defaulting to "unknown" if not provided
    const rawRegion = searchParams.get("region") ?? "unknown";

    // Validate the extracted region against the list of VALID_REGIONS; fallback to "unknown" if invalid
    const region = VALID_REGIONS.includes(rawRegion as RegionKey)
        // If valid, cast it to RegionKey type
        ? (rawRegion as RegionKey)
        // If invalid, assign "unknown"
        : "unknown";

    // Fetch the specific commodity impact data for the validated region asynchronously
    const regionImpact = await getRegionImpact(region);

    // Construct the response object conforming to the CommodityApiResponse interface
    const response: CommodityApiResponse = {
        // Enclose the fetched region impact data inside an array
        regions: [regionImpact],
        // Record the current time in ISO format as the fetch timestamp
        fetchedAt: new Date().toISOString(),
    };

    // Return the JSON response using NextResponse, including caching headers
    return NextResponse.json(response, {
        // Define HTTP headers for the response
        headers: {
            // Next.js handles caching the twelve data fetches, but we also cache the API route
            // Set Cache-Control header to cache the API response at the CDN level for 1 hour (3600 seconds)
            "Cache-Control": "public, s-maxage=3600",
        },
    });
}
