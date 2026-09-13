import { existsSync, rmSync, unlinkSync } from "fs";
import { join } from "path";
import { ComposeCommand } from "./compose-command";
import { readStream } from "./compose";
import { getCurrentReleaseDir } from "../core/release";
import { run, withLineBuffering } from "../core/run";
import type { Paths } from "../core/types";
import {
  isOperationRunning,
  markOperationFinished,
  markOperationRunning,
  appendOperationLog,
} from "./operations";

export async function startUninstall(paths: Paths, mode = "default") {
  if (isOperationRunning()) {
    throw new Error("Another operation is in progress");
  }

  markOperationRunning("uninstall");

  const currentDir = getCurrentReleaseDir(paths);

  if (currentDir && existsSync(currentDir)) {
    appendOperationLog("Stopping Docker services...\n");
    const desc = ComposeCommand.forTeardown(paths).down();
    const proc = Bun.spawn({
      cmd: withLineBuffering(desc.cmd),
      cwd: desc.cwd,
      stdout: "pipe",
      stderr: "pipe",
      env: desc.env,
    });

    readStream(proc.stdout).catch(() => {});
    readStream(proc.stderr).catch(() => {});

    await proc.exited;
  }

  await finishUninstall(paths, mode);
  markOperationFinished(0);

  // Schedule daemon self-shutdown
  setTimeout(() => {
    (process.platform === "linux" ? run("systemctl", ["stop", "pomelod"]) : Promise.resolve())
      .catch(() => {})
      .finally(() => {
        process.exit(0);
      });
  }, 1000);
}

// systemd/symlink cleanup is Linux production-only; skipped on dev/Windows/macOS
async function finishUninstall(
  paths: Paths,
  mode: string,
) {
  if (process.platform === "linux") {
    const serviceFile = "/etc/systemd/system/pomelod.service";
    try {
      appendOperationLog("Disabling systemd service...\n");
      await run("systemctl", ["disable", "pomelod"]);
      if (existsSync(serviceFile)) {
        unlinkSync(serviceFile);
      }
      await run("systemctl", ["daemon-reload"]);
    } catch {}

    const cliSymlink = "/usr/local/bin/pomelo";
    try {
      if (existsSync(cliSymlink)) {
        appendOperationLog("Removing CLI symlink...\n");
        unlinkSync(cliSymlink);
      }
    } catch {}
  }

  try {
    appendOperationLog("Removing application files...\n");
    rmSync(join(paths.root, "app"), { recursive: true, force: true });
    rmSync(paths.runtimeDir, { recursive: true, force: true });
  } catch {}

  if (mode === "full") {
    try {
      appendOperationLog("Removing data and configuration...\n");
      rmSync(paths.dataDir, { recursive: true, force: true });
      rmSync(paths.configDir, { recursive: true, force: true });
    } catch {}
  }
  if (mode !== "keep-data" && mode !== "full") {
    try {
      appendOperationLog("Removing configuration...\n");
      rmSync(paths.configDir, { recursive: true, force: true });
    } catch {}
  }
}
