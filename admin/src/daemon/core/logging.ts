import { appendFileSync } from "fs";
import { join } from "path";
import type { Logger, Paths } from "./types";

export function createLogger(logFile: string): Logger {
  return {
    info(message: string) {
      const line = `[${new Date().toISOString()}] ${message}\n`;
      appendFileSync(logFile, line);
    },
    error(message: string) {
      const line = `[${new Date().toISOString()}] ERROR: ${message}\n`;
      appendFileSync(logFile, line);
    },
  };
}

export function getLogFilePath(paths: Paths) {
  return join(paths.logsDir, "pomelod.log");
}
