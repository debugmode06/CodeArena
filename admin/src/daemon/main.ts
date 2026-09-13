import { unlinkSync, writeFileSync } from "fs";
import { join } from "path";
import { parseArgs } from "./core/args";
import { spawnDaemon } from "./core/daemonize";
import { createRequestHandler } from "./web/handlers";
import { createLogger, getLogFilePath } from "./core/logging";
import { ensureBase, getPaths } from "./core/paths";

export async function runDaemon(argv: string[], moduleUrl: string) {
  const args = parseArgs(argv);
  if (args.root) process.env.POMELO_ROOT = args.root;
  if (args.host) process.env.POMELO_HOST = args.host;
  if (args.port) process.env.POMELO_PORT = String(args.port);
  if (args.appCompose) process.env.POMELO_APP_COMPOSE = args.appCompose;
  if (args.citronCompose) process.env.POMELO_CITRON_COMPOSE = args.citronCompose;

  if (args.daemonize) {
    spawnDaemon(args, moduleUrl);
    process.exit(0);
  }

  const paths = getPaths();
  ensureBase(paths);

  // We need to conditionally import parseConfigYaml because it's not present in this scope yet
  // Or we can just import it at the top
  const { parseConfigYaml } = await import("./core/config");
  const cfgYaml = parseConfigYaml(paths);
  if (cfgYaml?.ports?.admin) {
    paths.apiPort = Number(cfgYaml.ports.admin);
  }

  const logFile = getLogFilePath(paths);
  const logger = createLogger(logFile);

  const pidFile = join(paths.runtimeDir, "daemon.pid");
  writeFileSync(pidFile, String(process.pid));
  logger.info(`pomelod pid ${process.pid}`);

  // One-shot: an upgraded install still has the previous engine's containers running,
  // and the compose file that could stop them is gone.
  const { cleanupLegacyEngine } = await import("./services/legacy-cleanup");
  await cleanupLegacyEngine(paths, logger);

  const server = Bun.serve({
    hostname: paths.apiHost,
    port: paths.apiPort,
    fetch: createRequestHandler(paths),
    idleTimeout: 255,
  });

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  logger.info(`pomelod listening on http://${paths.apiHost}:${paths.apiPort}`);

  function shutdown(signal: string) {
    logger.info(`pomelod shutting down (${signal})`);
    try {
      unlinkSync(pidFile);
    } catch {}
    server.stop();
    process.exit(0);
  }
}
