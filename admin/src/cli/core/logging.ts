export const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

export function logInfo(msg: string) {
  console.log(`${colors.blue}[INFO]${colors.reset}    ${msg}`);
}

export function logSuccess(msg: string) {
  console.log(`${colors.green}[  OK  ]${colors.reset}  ${msg}`);
}

export function logWarn(msg: string) {
  console.log(`${colors.yellow}[WARN]${colors.reset}    ${msg}`);
}

export function logError(msg: string) {
  console.error(`${colors.red}[ERROR]${colors.reset}   ${msg}`);
}

export function logStep(msg: string) {
  console.log(`${colors.bold}${colors.cyan}──── ${msg} ────${colors.reset}`);
}

export function exitWithError(message: string, code: number) {
  logError(message);
  process.exit(code ?? 1);
}
