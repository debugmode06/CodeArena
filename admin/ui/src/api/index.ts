import { request } from "./client.js";
import type { ConfigSnapshot, CreateUserPayload, Status, StorageUsage, UpdateUserPayload, User, PaginatedUsers } from "../types.js";

export const api = {
  // Health & Status
  getStatus: () => request<Status>("/status"),

  // Lifecycle
  start: () => {
    window.dispatchEvent(new Event("action-started"));
    return request("/start", { method: "POST" })
      .catch((err) => { window.dispatchEvent(new CustomEvent("action-error", { detail: err.message })); throw err; })
      .finally(() => window.dispatchEvent(new Event("command-started")));
  },
  stop: () => {
    window.dispatchEvent(new Event("action-started"));
    return request("/stop", { method: "POST" })
      .catch((err) => { window.dispatchEvent(new CustomEvent("action-error", { detail: err.message })); throw err; })
      .finally(() => window.dispatchEvent(new Event("command-started")));
  },
  restart: (target?: "all" | "caddy" | "caddy-restart" | "citron") => {
    window.dispatchEvent(new Event("action-started"));
    return request("/restart", { method: "POST", body: JSON.stringify({ target }) })
      .catch((err) => { window.dispatchEvent(new CustomEvent("action-error", { detail: err.message })); throw err; })
      .finally(() => window.dispatchEvent(new Event("command-started")));
  },

  // Config
  getConfig: () => request<ConfigSnapshot>("/config"),
  updateConfig: (payload: Partial<ConfigSnapshot>) =>
    request("/config", { method: "PUT", body: JSON.stringify(payload) }),
  validateConfig: () =>
    request<{ envErrors: string[] }>("/config/validate", { method: "POST" }),
  testConnection: (payload: { type: string, uri: string }) => request("/test-connection", { method: "POST", body: JSON.stringify(payload) }),

  // Storage
  getStorage: () => request<StorageUsage>("/storage"),

  // Logs
  getLogs: async (source: string, tail = 200) => {
    const res = await fetch(
      `/api/logs?source=${encodeURIComponent(source)}&tail=${tail}`,
    );
    if (!res.ok) throw new Error("Failed to load logs");
    return res.text();
  },

  // Uninstall
  uninstall: (mode: string) => {
    window.dispatchEvent(new Event("action-started"));
    return request("/uninstall", { method: "POST", body: JSON.stringify({ mode }) })
      .catch((err) => { window.dispatchEvent(new CustomEvent("action-error", { detail: err.message })); throw err; })
      .finally(() => window.dispatchEvent(new Event("command-started")));
  },

  // Users
  listUsers: (params?: { role?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.role) query.set("role", params.role);
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    return request<PaginatedUsers>(`/users?${query.toString()}`);
  },
  createUser: (data: CreateUserPayload) =>
    request<User>("/users", { method: "POST", body: JSON.stringify(data) }),
  updateUser: (id: string, data: UpdateUserPayload) =>
    request<User>(`/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteUser: (id: string) =>
    request(`/users/${id}`, { method: "DELETE" }),
};

/**
 * Connect to the ongoing background command stream and listen to logs.
 */
export async function connectCommandStream(
  onChunk: (text: string) => void,
  onExit: (code: number) => void,
  onIdle: () => void,
  signal?: AbortSignal
): Promise<void> {
  try {
    const res = await fetch(`/api/command/stream`, { signal });
    if (!res.ok) {
      onIdle();
      return;
    }
    
    if (res.headers.get("content-type")?.includes("application/json")) {
      onIdle();
      return;
    }

    const reader = res.body?.getReader();
    if (!reader) {
      onIdle();
      return;
    }

    const decoder = new TextDecoder();
    let exitCode = 0;
    let didExit = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value, { stream: true });
      
      let chunkOutput = text;
      const exitMatch = text.match(/\[POMELO_EXIT:(\d+)\]/);
      if (exitMatch) {
        exitCode = parseInt(exitMatch[1], 10);
        chunkOutput = text.replace(/\n?\[POMELO_EXIT:\d+\]\n?/g, "");
        didExit = true;
      }
      
      if (chunkOutput) {
        onChunk(chunkOutput);
      }
    }

    if (didExit) {
      onExit(exitCode);
    } else {
      onIdle();
    }
  } catch (err: any) {
    if (err.name !== "AbortError") {
      onIdle();
    }
  }
}
