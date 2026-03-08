/**
 * app/api/commodities/route.ts
 *
 * Returns commodity impact data for a given region.
 */

import { NextRequest, NextResponse } from "next/server";
import { getRegionImpact } from "@/lib/commodityService";
import { RegionKey, CommodityApiResponse } from "@/types";

export const dynamic = "force-dynamic";

const VALID_REGIONS: RegionKey[] = [
    "middle_east",
    "europe",
    "east_asia",
    "south_asia",
    "africa",
    "latin_america",
    "north_america",
    "central_asia",
    "oceania",
    "unknown",
];

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const rawRegion = searchParams.get("region") ?? "unknown";

    const region = VALID_REGIONS.includes(rawRegion as RegionKey)
        ? (rawRegion as RegionKey)
        : "unknown";

    const regionImpact = getRegionImpact(region);

    const response: CommodityApiResponse = {
        regions: [regionImpact],
        fetchedAt: new Date().toISOString(),
    };

    return NextResponse.json(response, {
        headers: {
            "Cache-Control": "public, s-maxage=60",
        },
    });
}
