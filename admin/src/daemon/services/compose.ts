import { existsSync, readFileSync } from "fs";
import { join } from "path";
import {
  isOperationRunning,
  markOperationFinished,
  markOperationRunning,
  appendOperationLog,
} from "./operations";
import { ComposeCommand } from "./compose-command";
import type { CommandDescriptor } from "./compose-command";
import { run, withLineBuffering } from "../core/run";
import type { Paths } from "../core/types";

export async function dockerAvailable() {
  const res = await run("docker", ["info"]);
  return res.code === 0;
}

/**
 * Read a Bun subprocess stream and pipe chunks into the operation log.
 * Shared by startCompose and startUninstall.
 */
export async function readStream(stream: ReadableStream) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  while (true) {
    try {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        appendOperationLog(decoder.decode(value, { stream: true }));
      }
    } catch {
      break;
    }
  }
}

/**
 * Run a compose command synchronously and return { code, stdout, stderr }.
 */
export async function runCompose(desc: CommandDescriptor) {
  return run(desc.cmd[0], desc.cmd.slice(1), {
    cwd: desc.cwd,
    env: desc.env,
  });
}

/**
 * Run a sequence of compose commands in the background with streaming output.
 *
 * @param operation  Human-readable name (e.g. "start", "restart")
 * @param steps      Sequential command descriptors with labels.
 *                   Execution stops at the first failure.
 */
export async function startCompose(
  paths: Paths,
  operation: string,
  steps: { label?: string; descriptor: CommandDescriptor }[],
) {
  if (isOperationRunning()) {
    throw new Error("Another operation is in progress");
  }

  if (!(await dockerAvailable())) {
    throw new Error("Docker unavailable");
  }

  if (!steps.length) return;

  markOperationRunning(operation);

  // Run steps sequentially in background
  (async () => {
    let lastCode = 0;
    try {
      for (const step of steps) {
        if (step.label) appendOperationLog(`\n${step.label}\n`);

        const proc = Bun.spawn({
          cmd: withLineBuffering(step.descriptor.cmd),
          cwd: step.descriptor.cwd,
          stdout: "pipe",
          stderr: "pipe",
          env: { ...step.descriptor.env, BUILDKIT_PROGRESS: "plain" },
        });

        readStream(proc.stdout).catch(() => {});
        readStream(proc.stderr).catch(() => {});
        await proc.exited;
        lastCode = proc.exitCode ?? 1;
        if (lastCode !== 0) break;
      }
    } catch {
      lastCode = 1;
    }
    markOperationFinished(lastCode);
  })();
}

export async function logsResponse(paths: Paths, params: URLSearchParams) {
  const source = params.get("source") ?? "app";
  const follow = params.get("follow") === "1";
  const tail = Number(params.get("tail") ?? "200");

  if (source === "daemon") {
    const logFile = join(paths.logsDir, "pomelod.log");
    const content = tailFile(logFile, tail);
    return new Response(content, { headers: { "content-type": "text/plain" } });
  }

  const compose = ComposeCommand.from(paths);
  const services = source === "app" ? undefined : [source];
  const desc = compose.logs({ services, tail, follow });

  const proc = Bun.spawn({
    cmd: desc.cmd,
    cwd: desc.cwd,
    stdout: "pipe",
    stderr: "pipe",
    env: desc.env,
  });

  const stream = new ReadableStream({
    start(controller) {
      proc.stdout.pipeTo(
        new WritableStream({
          write(chunk) {
            controller.enqueue(chunk);
          },
        }),
      );
      proc.stderr.pipeTo(
        new WritableStream({
          write(chunk) {
            controller.enqueue(chunk);
          },
        }),
      );
      proc.exited.then(() => controller.close());
    },
  });

  return new Response(stream, { headers: { "content-type": "text/plain" } });
}

function tailFile(path: string, lines: number) {
  if (!existsSync(path)) return "";
  const content = readFileSync(path, "utf8");
  const parts = content.split(/\r?\n/);
  return parts.slice(-lines).join("\n");
}
