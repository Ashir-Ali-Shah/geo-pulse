/**
 * lib/db/connection.ts
 *
 * Singleton MongoDB client — reuses the connection across hot-reloads in
 * Next.js dev mode. Uses the native driver (no Mongoose overhead).
 */

import { MongoClient, Db } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) throw new Error("MONGODB_URI is not set in environment");

const DB_NAME = "geopulse";

// In dev, store client in global to survive HMR
declare global {
    // eslint-disable-next-line no-var
    var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
    if (!global._mongoClientPromise) {
        const client = new MongoClient(MONGODB_URI);
        global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
} else {
    const client = new MongoClient(MONGODB_URI);
    clientPromise = client.connect();
}

export async function getDb(): Promise<Db> {
    const client = await clientPromise;
    return client.db(DB_NAME);
}

export default clientPromise;
