import {
  handleLogs,
  handleStatus,
  handleStreamingCommand,
  handleUninstall,
  openUi,
} from "./commands/commands";
import { exitWithError, logStep } from "./core/logging";
import { printUsage } from "./core/usage";

export async function runCli(argv: string[]) {
  if (argv.length === 0 || ["-h", "--help"].includes(argv[0])) {
    printUsage();
    return;
  }

  const cmd = argv[0];
  const rest = argv.slice(1);

  switch (cmd) {
    case "start":
      logStep("Starting Pomelo Services");
      return handleStreamingCommand(
        "POST",
        "/api/start",
        "Services started successfully",
      );
    case "stop":
      logStep("Stopping Pomelo Services");
      return handleStreamingCommand(
        "POST",
        "/api/stop",
        "Services stopped successfully",
      );
    case "restart":
      logStep("Restarting Pomelo Services");
      return handleStreamingCommand(
        "POST",
        "/api/restart",
        "Services restarted successfully",
      );
    case "status":
      return handleStatus();
    case "logs":
      return handleLogs(rest);
    case "ui":
      return openUi();
    case "uninstall":
      logStep("Uninstalling Pomelo");
      return handleUninstall(rest);
    default:
      exitWithError(`Unknown command: ${cmd}`, 1);
  }
}
