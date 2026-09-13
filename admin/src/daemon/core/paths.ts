import { existsSync, mkdirSync } from "fs";
import { join } from "path";
import { resolveWorkspaceRoot } from "./dev";
import type { Paths } from "./types";

export function getPaths(): Paths {
  const root = resolveWorkspaceRoot();
  const apiHost = process.env.POMELO_HOST ?? "127.0.0.1";
  const apiPort = Number(process.env.POMELO_PORT ?? "8462");
  const configDir = join(root, "config");
  const dataDir = join(root, "data");
  const runtimeDir = join(root, "runtime");
  const logsDir = join(runtimeDir, "logs");
  const tmpDir = join(runtimeDir, "tmp");
  const uiDistDir = existsSync(join(root, "app", "admin", "dist"))
    ? join(root, "app", "admin", "dist")
    : join(root, "admin", "dist");
  const appEnvPath = join(configDir, "app.env");
  const envFile = existsSync(appEnvPath) ? appEnvPath : (existsSync(join(root, ".env")) ? join(root, ".env") : appEnvPath);
  const configFile = join(configDir, "config.yaml");
  const caddyFile = join(configDir, "Caddyfile");
  const citronConfFile = join(configDir, "citron.conf");
  const citronLanguagesFile = join(configDir, "languages.toml");

  return {
    root,
    apiHost,
    apiPort,
    configDir,
    dataDir,
    runtimeDir,
    logsDir,
    tmpDir,
    uiDistDir,
    envFile,
    configFile,
    caddyFile,
    citronConfFile,
    citronLanguagesFile,
  };
}

export function getComposeConfig() {
  const root = resolveWorkspaceRoot();
  const baseDir = existsSync(join(root, "app", "docker")) ? join(root, "app") : root;

  const appDev = join(baseDir, "docker/app/docker-compose.dev.yaml");
  const appProd = join(baseDir, "docker/app/docker-compose.yaml");
  const citronDev = join(baseDir, "docker/citron/docker-compose.dev.yaml");
  const citronProd = join(baseDir, "docker/citron/docker-compose.yaml");

  return {
    app: process.env.POMELO_APP_COMPOSE ?? (existsSync(appDev) ? appDev : appProd),
    citron: process.env.POMELO_CITRON_COMPOSE ?? (existsSync(citronDev) ? citronDev : citronProd),
    project: process.env.POMELO_DOCKER_PROJECT ?? "pomelo",
  };
}

export function ensureBase(paths: Paths) {
  mkdirSync(paths.configDir, { recursive: true });
  mkdirSync(paths.dataDir, { recursive: true });
  mkdirSync(paths.runtimeDir, { recursive: true });
  mkdirSync(paths.logsDir, { recursive: true });
  mkdirSync(paths.tmpDir, { recursive: true });
}
