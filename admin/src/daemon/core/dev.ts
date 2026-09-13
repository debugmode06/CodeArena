import { existsSync } from "fs";
import { dirname, join, parse } from "path";

export interface DevConfig {
  isDev: boolean;
  viteUrl: string;
}

/**
 * Resolves the workspace root directory in local development by traversing upwards.
 */
export function resolveWorkspaceRoot(): string {
  if (process.env.POMELO_ROOT) return process.env.POMELO_ROOT;

  let curr = process.cwd();
  while (curr && curr !== "/" && curr !== parse(curr).root) {
    if (existsSync(join(curr, "pnpm-workspace.yaml")) || existsSync(join(curr, ".env"))) {
      return curr;
    }
    const parent = dirname(curr);
    if (parent === curr) break;
    curr = parent;
  }
  return "/opt/pomelo";
}

/**
 * Returns true if running in local development mode.
 */
export function isDevMode(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.POMELO_DEV === "true") return true;
  const root = resolveWorkspaceRoot();
  return root !== "/opt/pomelo";
}

/**
 * Returns development configuration settings.
 */
export function getDevConfig(): DevConfig {
  return {
    isDev: isDevMode(),
    viteUrl: process.env.VITE_DEV_SERVER_URL || "http://localhost:5173",
  };
}

/**
 * Resolves the daemon binary path for local dev or production installations.
 */
export function resolveDaemonBinary(root: string): string | null {
  if (process.env.POMELO_DAEMON_BIN && existsSync(process.env.POMELO_DAEMON_BIN)) {
    return process.env.POMELO_DAEMON_BIN;
  }
  const devBin = join(root, "admin", "bin", "pomelod");
  const prodBin = join(root, "app", "admin", "bin", "pomelod");

  if (existsSync(devBin)) return devBin;
  if (existsSync(prodBin)) return prodBin;
  return null;
}
