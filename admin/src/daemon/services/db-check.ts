import { MongoClient } from "mongodb";

/**
 * Validates that an external MongoDB URI is reachable and has read/write permissions.
 * Only used when database.mode = "external" — internal mode launches Mongo via Docker Compose.
 */
export async function validateMongoConnection(uri: string): Promise<void> {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
  try {
    await client.connect();
    const db = client.db();
    
    // Test write permission to ensure full operability
    const testCol = db.collection("__pomelo_test_connection");
    await testCol.insertOne({ test: true, createdAt: new Date() });
    await testCol.deleteOne({ test: true });
  } catch (err: any) {
    throw new Error(`MongoDB connection/permission failed: ${err.message}`);
  } finally {
    await client.close(true);
  }
}

function parseMongoUri(uri: string): { hostname: string; port: string | null } {
  try {
    // Strip mongodb:// or mongodb+srv:// prefix then grab host:port before /
    const withoutScheme = uri.replace(/^mongodb(\+srv)?:\/\//, "");
    // Remove credentials if present
    const hostPart = withoutScheme.includes("@")
      ? withoutScheme.split("@")[1]
      : withoutScheme;
    // Remove path/options
    const hostAndPort = hostPart.split("/")[0].split("?")[0];
    const lastColon = hostAndPort.lastIndexOf(":");
    if (lastColon === -1) return { hostname: hostAndPort, port: null };
    const hostname = hostAndPort.slice(0, lastColon);
    const port = hostAndPort.slice(lastColon + 1);
    return { hostname, port };
  } catch {
    return { hostname: "localhost", port: null };
  }
}
