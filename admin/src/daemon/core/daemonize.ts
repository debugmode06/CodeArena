import { fileURLToPath } from "url";
import type { DaemonArgs } from "./args";

export function spawnDaemon(args: DaemonArgs, moduleUrl: string) {
  const isCompiled = moduleUrl.includes("$bunfs");
  const scriptPath = fileURLToPath(moduleUrl);
  const cmd = isCompiled
    ? [process.execPath, "--foreground"]
    : [process.execPath, scriptPath, "--foreground"];
  if (args.root) cmd.push("--root", args.root);
  if (args.host) cmd.push("--host", args.host);
  if (args.port) cmd.push("--port", String(args.port));
  if (args.appCompose) cmd.push("--app-compose", args.appCompose);
  if (args.citronCompose) cmd.push("--citron-compose", args.citronCompose);

  Bun.spawn({
    cmd,
    stdin: "ignore",
    stdout: "ignore",
    stderr: "ignore",
    env: { ...process.env },
  });
}
