import { API_BASE } from "../core/config";
import { exitWithError } from "../core/logging";

export async function fetchDaemon(method: string, path: string, body?: any) {
  const url = `${API_BASE}${path}`;
  try {
    const res = await fetch(url, {
      method,
      headers: body ? { "content-type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });

    const isJson = res.headers
      .get("content-type")
      ?.includes("application/json");
    const payload = isJson ? await res.json() : await res.text();

    if (!res.ok) {
      const message =
        payload?.error || payload?.message || payload || "Unknown error";
      throw new Error(message);
    }
    return payload;
  } catch (err: any) {
    if (
      err.message === "fetch failed" ||
      err.message.includes("Connection refused")
    ) {
      exitWithError("Pomelo daemon is unavailable. Is it running?", 2);
    }
    exitWithError(err.message || "Unknown error", 1);
  }
}
