import { API_BASE } from "../core/config";
import { fetchDaemon } from "../services/client";
import { ensureDaemon } from "../services/daemon";
import {
  colors,
  exitWithError,
  logError,
  logInfo,
  logStep,
  logSuccess,
  logWarn,
} from "../core/logging";

export async function handleSimpleCommand(
  method: string,
  path: string,
  successMessage: string,
  body?: any,
) {
  const payload = await fetchDaemon(method, path, body);
  if (payload?.data?.output) {
    console.log("");
    console.log(payload.data.output);
    console.log("");
  }
  logSuccess(successMessage);
}

export async function handleStreamingCommand(
  method: string,
  path: string,
  successMessage: string,
  body?: any,
) {
  const url = `${API_BASE}${path}`;
  try {
    let res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });

    let contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const payload = await res.json();
      if (!res.ok) {
        exitWithError(payload?.error || "Request failed", payload?.code || 1);
        return;
      }
      
      // Successfully initiated the operation. Now stream from /api/command/stream
      res = await fetch(`${API_BASE}/api/command/stream`);
      contentType = res.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        // Returned { status: "idle" } or similar, meaning nothing to stream
        logSuccess(successMessage);
        return;
      }
    } else if (!res.ok) {
      exitWithError(
        (await res.text()) || `Request failed (${res.status})`,
        1,
      );
      return;
    }

    const reader = res.body?.getReader();
    if (!reader) {
      logSuccess(successMessage);
      return;
    }

    const decoder = new TextDecoder();
    let exitCode = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        const text = decoder.decode(value, { stream: true });
        const exitMatch = text.match(/\[POMELO_EXIT:(\d+)\]/);
        if (exitMatch) {
          exitCode = parseInt(exitMatch[1], 10);
          const clean = text.replace(/\n?\[POMELO_EXIT:\d+\]\n?/g, "");
          if (clean) process.stdout.write(clean);
        } else {
          process.stdout.write(text);
        }
      }
    }

    console.log("");
    if (exitCode === 0) {
      logSuccess(successMessage);
    } else {
      exitWithError(`Command failed with exit code ${exitCode}`, exitCode);
    }
  } catch (err: any) {
    if (
      err.message === "fetch failed" ||
      err.message?.includes("Connection refused")
    ) {
      exitWithError("Pomelo daemon is unavailable. Is it running?", 2);
    }
    exitWithError(err.message || "Unknown error", 1);
  }
}

export async function handleStatus() {
  logStep("System Status");
  const payload = await fetchDaemon("GET", "/api/status");
  const data = payload?.data;

  if (!data) {
    logError("Received invalid status data from daemon.");
    return;
  }

  console.log(
    `  ${colors.bold}Version:${colors.reset}        ${data.currentVersion || "unknown"}`,
  );

  const isRunning = data.containers && data.containers.length > 0;
  console.log(
    `  ${colors.bold}Status:${colors.reset}         ${isRunning ? colors.green + "Running" + colors.reset : colors.dim + "Stopped" + colors.reset}`,
  );

  console.log("");

  if (isRunning) {
    console.log(`  ${colors.bold}Containers:${colors.reset}`);
    const maxNameLen = Math.max(
      ...data.containers.map(
        (c: any) => (c.Name || c.name || "unknown").length,
      ),
    );
    const namePad = Math.max(20, maxNameLen + 2);

    for (const container of data.containers) {
      const name = container.Name || container.name || "unknown";
      const state = container.State || container.state || "unknown";
      const statusStr = container.Status || container.status || "";

      const stateColor =
        state.toLowerCase() === "running" ? colors.green : colors.red;
      console.log(
        `    ${colors.cyan}${name.padEnd(namePad)}${colors.reset} ${stateColor}${state.padEnd(10)}${colors.reset} ${colors.dim}${statusStr}${colors.reset}`,
      );
    }
  } else {
    console.log(
      `  ${colors.dim}No containers are currently running.${colors.reset}`,
    );
  }
  console.log("");
}

export async function handleLogs(rest: string[]) {
  const follow = rest.includes("--follow");
  const tailIndex = rest.indexOf("--tail");
  const tail = tailIndex >= 0 ? Number(rest[tailIndex + 1]) : 200;
  const source = rest.find((arg) => !arg.startsWith("--")) ?? "app";

  const query = new URLSearchParams({ source, tail: String(tail) });
  if (follow) query.set("follow", "1");

  const url = `${API_BASE}/api/logs?${query.toString()}`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      exitWithError(`Failed to fetch logs: ${res.statusText}`, res.status);
      return;
    }
    if (!follow) {
      const text = await res.text();
      console.log(text);
      return;
    }
    const reader = res.body?.getReader();
    if (!reader) return;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) process.stdout.write(value);
    }
  } catch {
    exitWithError("Daemon unavailable", 2);
  }
}

export async function openUi() {
  await ensureDaemon();
  const url = API_BASE.replace(/\/api$/, "");
  const opener = await which("xdg-open");

  logStep("Opening Admin UI");
  console.log(
    `  ${colors.bold}URL:${colors.reset} ${colors.cyan}${url}${colors.reset}`,
  );
  console.log("");

  if (!opener) {
    logInfo(
      "Could not find a browser opener (xdg-open). Please open the URL manually.",
    );
    return;
  }

  Bun.spawn({ cmd: [opener, url], stdout: "ignore", stderr: "ignore" });
  logSuccess("Browser opened.");
}

export async function handleUninstall(rest: string[]) {
  let mode = "default";
  if (rest.includes("--keep-data")) mode = "keep-data";
  if (rest.includes("--full")) mode = "full";

  logWarn("You are about to uninstall Pomelo.");
  if (mode === "full") {
    logWarn(
      `This will ${colors.red}ALSO delete all data, database, and configurations!${colors.reset}`,
    );
  } else if (mode === "keep-data") {
    logInfo("Data and configuration will be preserved.");
  } else {
    logInfo("Configuration will be deleted, but data preserved.");
  }

  process.stdout.write(
    `\n  ${colors.bold}${colors.magenta}▸${colors.reset} Are you sure you want to proceed? [y/N]: `,
  );

  const confirm = await new Promise<string>((resolve) => {
    process.stdin.resume();
    process.stdin.once("data", (data) => {
      process.stdin.pause();
      resolve(data.toString().trim());
    });
  });

  if (confirm.toLowerCase() !== "y") {
    console.log("\n  Aborted.");
    process.exit(0);
  }

  console.log("");
  await handleStreamingCommand(
    "POST",
    "/api/uninstall",
    "Pomelo uninstalled successfully.",
    { mode },
  );
}

async function which(cmd: string) {
  try {
    const proc = Bun.spawn({
      cmd: ["which", cmd],
      stdout: "pipe",
      stderr: "ignore",
    });
    const output = await new Response(proc.stdout).text();
    const code = await proc.exited;
    if (code === 0) return output.trim();
  } catch { }
  return null;
}
