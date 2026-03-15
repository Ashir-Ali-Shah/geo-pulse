/**
 * app/api/sync/route.ts
 *
 * Sync endpoint — fetches news for all conflict theaters, deduplicates,
 * stores in MongoDB, and recomputes conflict zones.
 *
 * GET  /api/sync         → returns last sync status
 * POST /api/sync         → triggers a full sync (returns immediately, runs in bg)
 * POST /api/sync?inline=1 → triggers sync and waits for completion (for testing)
 */

// Import NextRequest and NextResponse objects from Next.js server module for API routing
import { NextRequest, NextResponse } from "next/server";
// Import all necessary data access and utility functions concerning MongoDB collections
import {
    // Function to make sure required DB indices exist
    ensureIndexes,
    // Function to insert or update articles deduplicated by URL
    upsertArticles,
    // Function to insert or update pre-computed conflict zone statistics
    upsertConflictZones,
    // Function to retrieve recently stored articles, grouped by country
    getRecentArticlesByCountry,
    // Function to create a log entry whenever sync starts
    createSyncLog,
    // Function to update the log entry as sync progresses or finishes
    updateSyncLog,
    // Function to fetch the most recent sync status log
    getLastSyncLog,
} from "@/lib/db/articleRepository";
// Import methods to connect with the newsdata.io API and parse theater keys
import {
    // Fetches multiple predefined queries for all significant conflict global zones
    fetchAllConflictTheaters,
    // Formats raw API news artifacts to MongoDB schema compliant documents
    toArticleDocument,
    // Converts generic country identifiers/iso keys to our specialized resolved format
    resolveCountryKeys,
    // The master constant array defining the current conflict theaters
    CONFLICT_THEATERS,
} from "@/lib/conflictQueryService";
// Import algorithmic function that converts raw article frequencies to normalized risk scores
import { computeConflictZones } from "@/lib/zoneComputer";
// Import the TypeScript definition of the Article Document structure matching MongoDB DB schema
import { ArticleDocument } from "@/lib/db/schema";

// Instruct Next.js to always evaluate this file dynamically instead of statically caching it at build time
export const dynamic = "force-dynamic";

// ─── GET: Status check ────────────────────────────────────────────────────────

// Handler for HTTP GET requests, generally used to inspect the status of the background sync worker
export async function GET() {
    // Try wrapping database fetches in a block capable of gracefully trapping unexpected exceptions
    try {
        // Assert that required indexing strategy on Mongo has completed prior to querying
        await ensureIndexes();
        // Request the most recent valid log entry denoting the previous sync operation's outcome
        const last = await getLastSyncLog();
        // Emit the returned log via standard JSON formatting, conveying that connection succeeded
        return NextResponse.json({ status: "ok", lastSync: last });
    // Catch clause triggered upon encountering connection, parsing, or data structure faults
    } catch (err) {
        // Respond to the client with an HTTP 500 status payload indicating underlying failure details
        return NextResponse.json(
            // Payload content stringifying the specific error condition encountered
            { status: "error", error: (err as Error).message },
            // Overridden config specifying exact server-side error code (HTTP 500)
            { status: 500 }
        );
    }
}

// ─── POST: Trigger sync ───────────────────────────────────────────────────────

// Handler for HTTP POST requests, initiating the process of communicating with newsdata api via sync pipeline
export async function POST(req: NextRequest) {
    // Extract search query arguments, if any exist, attached inside the URL structure
    const { searchParams } = new URL(req.url);
    // Assess if `inline=1` exists inside the search parameters, coercing it to boolean
    const inline = searchParams.get("inline") === "1";

    // Set up try-catch wrapper ensuring MongoDB collections are correctly prepared
    try {
        // Wait on the ensuring function logic guaranteeing unique URL/Date indexes are populated
        await ensureIndexes();
    // Handler invoked if network faults obstruct reaching the DB before the Sync starts
    } catch (err) {
        // Issue early 500 status and alert the client exactly why initial pipeline step failed
        return NextResponse.json(
            // Concise message explaining initialization fault linked to native error reason
            { error: "DB init failed: " + (err as Error).message },
            // Formal HTTP error configuration response parameter
            { status: 500 }
        );
    }

    // Checking if synchronous operational mode was flagged (primarily meant for controlled environments)
    if (inline) {
        // Wait for the full sync before responding
        // Block thread natively until the complete remote fetch + local database upsert cascade has finalized
        const result = await runFullSync();
        // Return exactly what the pipeline formulated as its finishing state map without background indirection
        return NextResponse.json(result);
    // Mode to assume if the caller is just another frontend or general non-testing client
    } else {
        // Fire-and-forget — respond immediately
        // Invoke the asynchronous payload without awaiting, triggering asynchronous detached operation
        runFullSync().catch((e) =>
            // Standard error output stream invocation if detached sync process encounters fatal crash
            console.error("[Sync] Background sync failed:", e)
        );
        // Reply natively with an optimistic json message confirming the receipt and launch of the instruction
        return NextResponse.json({
            // Confirmation that the instruction payload correctly registered
            status: "started",
            // General guidance telling client to start actively checking `/api/sync` GET for status confirmation
            message: "Sync running in background. Poll GET /api/sync for status.",
        });
    }
}

// ─── Core sync pipeline ───────────────────────────────────────────────────────

// Internal un-exported function executing the multi-phase news ingestion flow
async function runFullSync() {
    // Cache the accurate starting chronologic moment tracking duration and history insertion
    const startedAt = new Date();
    // Isolate map-keyed names corresponding to target geographical zones from raw theaters definition
    const queriesAttempted = CONFLICT_THEATERS.map((t) => t.key);
    // Array buffer meant to record queries that were retrieved completely appropriately
    const queriesSucceeded: string[] = [];
    // Array buffer meant to record queries that were terminated due to API throttling/missing domains
    const queriesFailed: string[] = [];
    // Catch-all list accumulating exact strings denoting any partial failure
    const errors: string[] = [];

    // Create a sync log entry
    // Invoke insertion of synchronous history block right at the moment operation actually engages
    const logId = await createSyncLog({
        // The start time timestamp just calculated above
        startedAt,
        // Represents incomplete progress
        completedAt: null,
        // The array containing targeted areas identified in earlier constants parsing
        queriesAttempted,
        // Array init stringly
        queriesSucceeded: [],
        // Array init natively
        queriesFailed: [],
        // Number representing 0 changes prior to pipeline action
        articlesUpserted: 0,
        // Empty error collection
        errors: [],
        // Represents in-progress status string
        status: "running",
    });

    // Tracking metric measuring absolute counts of documents actually inserted to MongoDB instance
    let totalArticlesUpserted = 0;

    // Outer try-catch wrapping remote HTTP operations ensuring any sudden disconnect doesn't corrupt database
    try {
        // 1. Fetch from all conflict theaters (rate-limit-safe)
        // Block asynchronously till all required 10-15 API GETs fulfill gracefully
        const { results, totalFetched } = await fetchAllConflictTheaters();

        // 2. Convert to ArticleDocuments and upsert into MongoDB
        // Working buffer accumulating strictly mapped schema elements extracted from loose JSON outputs
        const allDocs: ArticleDocument[] = [];

        // Begin iteration through each discrete geographic target result item from above
        for (const result of results) {
            // Assess if the remote fetch API threw a block error (like native rate-limit HTTP 429)
            if (result.error) {
                // Keep history of failed endpoint target via geographic keys
                queriesFailed.push(result.query.key);
                // Keep literal textual history of reason why the endpoint disconnected/refused handling
                errors.push(`${result.query.key}: ${result.error}`);
                // Break current inner block and proceed analyzing the next target
                continue;
            }

            // Successfully returned endpoint targets proceed appending to historic collection list
            queriesSucceeded.push(result.query.key);

            // Inner iteration loop parsing singular standard articles from complex paginated API format
            for (const article of result.articles) {
                // Call formatter mapping plain fields onto rigorous strictly typed Schema definitions
                const doc = toArticleDocument(article, result.query);
                // Deposit newly constructed Document onto mass-aggregation chunk array
                allDocs.push(doc);
            }
        }

        // Send huge chunk of constructed docs towards massive upsert driver within db directory tools
        totalArticlesUpserted = await upsertArticles(allDocs);

        // 3. Recompute conflict zones from all recent articles in MongoDB
        // Pull down 24-hours rolling window grouped loosely by native ISO-2 country definitions
        const articlesByCountry = await getRecentArticlesByCountry(24);

        // Also group by our resolved country keys (handle ISO2 from newsdata)
        // Create an optimized Map storing reordered components indexed precisely on system mapped variables
        const resolvedMap = new Map<string, ArticleDocument[]>();
        // Iterate across mapping results natively parsing raw inputs keys inside Map data structure
        for (const [rawKey, articles] of articlesByCountry.entries()) {
            // Resolve multiple varied identifiers back down to our single application canonical key
            const keys = resolveCountryKeys([rawKey], [rawKey]);
            // Utilize the fundamental zeroth index to bypass optional chaining exceptions
            const resolvedKey = keys[0] ?? rawKey;
            // Snag any previously accumulated results in order to build merged structures
            const existing = resolvedMap.get(resolvedKey) ?? [];
            // Mutate previous list pushing entirely new inputs straight in memory
            existing.push(...articles);
            // Deposit the modified larger array back onto map key reference object
            resolvedMap.set(resolvedKey, existing);
        }

        // Apply scoring metrics (Z-score + average normalization) to parsed input groupings
        const zones = computeConflictZones(resolvedMap);
        // Replace previous MongoDB zone schema records with fresh Z-scored structures calculated above
        await upsertConflictZones(zones);

        // 4. Update sync log
        // Capture finish timestamp post all computationally heavy asynchronous operations
        const completedAt = new Date();
        // Fire request to update running `status` document marking logical resolution map
        await updateSyncLog(logId, {
            // Set end block matching capture variable
            completedAt,
            // Insert successfully mapped key history array
            queriesSucceeded,
            // Insert partially failed URL targets
            queriesFailed,
            // Attach number denoting absolute total entries merged
            articlesUpserted: totalArticlesUpserted,
            // Dump recorded text-only logs collected on specific request failures
            errors,
            // Calculate final status dependent on exactly how the array lists shook out
            status:
                // Check if all operations passed fault checks yielding a perfectly clean array
                queriesFailed.length === 0
                    // Apply true 'complete' marker natively representing clean passage
                    ? "complete"
                    // Confirm if some operations succeeded despite presence of failed endpoints
                    : queriesSucceeded.length > 0
                        // Assign 'partial' representing mixed availability conditions
                        ? "partial"
                        // Else absolutely nothing successfully ran and total application state is broken
                        : "failed",
        });

        // Trigger console notification providing visual confirmation output regarding final computed scale
        console.log(
            // Concatenate template literals outputting all three core measurement sizes successfully handled
            `[Sync] Done. ${totalFetched} fetched, ${totalArticlesUpserted} upserted, ${zones.length} zones computed.`
        );

        // Construct programmatic object resolving precisely identical object configurations
        return {
            // Echo matching status identifier dependent purely on failure array count conditions
            status: queriesFailed.length === 0 ? "complete" : "partial",
            // Dump success targets natively into API output bundle
            queriesSucceeded,
            // Dump failed targets natively into API output bundle
            queriesFailed,
            // Attach formatted errors list natively into API output bundle
            errors,
            // Include numerical representation quantifying exact changes merged
            articlesUpserted: totalArticlesUpserted,
            // Provide quantity quantifying absolute changes across geographical targets
            zonesComputed: zones.length,
            // Destructure complex internal schema model definitions into basic object format
            zones: zones.map((z) => ({
                // Map the targeted nation identifier property natively
                country: z.country,
                // Map numerical conflict scale output strictly defined by z-score engine
                score: z.conflictScore,
                // Map visual color property originally established internally
                color: z.color,
                // Assign article volume mention count representation
                articles: z.mentionCount,
                // Assign boolean indicator driving animated red pulse graphics
                pulsing: z.isPulsing,
            })),
            // Output explicit processing delay latency via pure JavaScript date calculations
            durationMs: Date.now() - startedAt.getTime(),
        };
    // Ensure that major uncaught structural / engine logic panics fall backward directly
    } catch (err) {
        // Isolate the discrete message fragment mapping it onto the general buffer
        const msg = (err as Error).message;
        // Post the text into the array tracking history ensuring complete tracking context exists
        errors.push(msg);
        // Dispatch explicit fallback database trigger notifying that the pipeline functionally crashed completely
        await updateSyncLog(logId, {
            // Immediately cap execution duration via timestamp parameter usage
            completedAt: new Date(),
            // Explicitly force failure mode representing absolutely stalled components
            status: "failed",
            // Inject complete cumulative failures collection natively
            errors,
            // Send back what was completed before critical code section panic sequence natively
            queriesSucceeded,
            // Append target key elements identifying partial conditions preceding structural failure
            queriesFailed,
        });
        // Explode natively preventing caller elements from mistakenly assuming completion behavior
        throw err;
    }
}
