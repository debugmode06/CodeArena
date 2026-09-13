import { API_BASE, APP_ROOT } from "../core/config";
import { exitWithError, logInfo } from "../core/logging";
import { resolveDaemonBinary } from "../../daemon/core/dev";

export async function ensureDaemon() {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    if (res.ok) return;
  } catch {}
  await startDaemon();
}

export async function startDaemon() {
  if (await daemonAlive()) {
    logInfo("pomelod is already running");
    return;
  }
  const daemonBin = resolveDaemonBinary(APP_ROOT);
  if (!daemonBin) {
    exitWithError(`Daemon binary not found. Build it with 'pnpm --filter @pomelo/admin build:cli' or set POMELO_DAEMON_BIN.`, 1);
    return;
  }
  logInfo("Starting daemon...");
  Bun.spawn({
    cmd: [daemonBin, "--daemon"],
    stdin: "ignore",
    stdout: "ignore",
    stderr: "ignore",
    env: { ...process.env },
  });
  await waitForDaemon();
}

async function daemonAlive() {
  try {
    const res = await fetch(`${API_BASE}/api/health`);
    return res.ok;
  } catch {
    return false;
  }
}

async function waitForDaemon(timeoutMs = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await daemonAlive()) return;
    await new Promise((r) => setTimeout(r, 250));
  }
  exitWithError("pomelod did not start", 2);
}
