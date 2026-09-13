import { existsSync, readFileSync } from "fs";
import { join } from "path";
import YAML from "yaml";
import { resolveWorkspaceRoot } from "../../daemon/core/dev";

export const APP_ROOT = resolveWorkspaceRoot();

function resolveApiBase(): string {
  if (process.env.POMELO_API_URL) return process.env.POMELO_API_URL;
  try {
    const configFile = join(APP_ROOT, "config", "config.yaml");
    if (existsSync(configFile)) {
      const cfg = YAML.parse(readFileSync(configFile, "utf8"));
      const port = cfg?.ports?.admin;
      if (port && Number.isInteger(Number(port))) {
        return `http://127.0.0.1:${port}`;
      }
    }
  } catch {}
  return "http://127.0.0.1:8462";
}

export const API_BASE = resolveApiBase();
