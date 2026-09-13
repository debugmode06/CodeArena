import { colors } from "./logging";

export function printBanner() {
  console.log("");
  console.log(
    `${colors.bold}${colors.green}  ╔═══════════════════════════════════════════════╗${colors.reset}`,
  );
  console.log(
    `${colors.bold}${colors.green}  ║                 ${colors.reset}${colors.bold}Pomelo CLI${colors.green}                    ║${colors.reset}`,
  );
  console.log(
    `${colors.bold}${colors.green}  ╚═══════════════════════════════════════════════╝${colors.reset}`,
  );
  console.log("");
}

export function printUsage() {
  printBanner();
  console.log(`${colors.bold}Usage:${colors.reset}`);
  console.log(`  pomelo <command> [options]`);
  console.log("");
  console.log(`${colors.bold}Commands:${colors.reset}`);
  console.log(`  ${colors.cyan}start${colors.reset}      Start all services`);
  console.log(`  ${colors.cyan}stop${colors.reset}       Stop all services`);
  console.log(`  ${colors.cyan}restart${colors.reset}    Restart all services`);
  console.log(
    `  ${colors.cyan}status${colors.reset}     Check service and system status`,
  );
  console.log(
    `  ${colors.cyan}logs${colors.reset}       View logs (daemon, app, citron)`,
  );
  console.log(
    `  ${colors.cyan}ui${colors.reset}         Open the admin panel in browser`,
  );
  console.log(
    `  ${colors.cyan}uninstall${colors.reset}  Uninstall Pomelo (use --full to remove data)`,
  );
  console.log("");
  console.log(`${colors.bold}Options for 'logs':${colors.reset}`);
  console.log("  pomelo logs [source] [--follow] [--tail N]");
  console.log("  (Default source is 'app')");
  console.log("");
}
