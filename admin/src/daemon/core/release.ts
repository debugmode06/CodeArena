import { existsSync } from "fs";
import { join } from "path";
import type { Paths } from "./types";

export function getCurrentReleaseDir(paths: Paths) {
  const appDir = join(paths.root, "app");
  if (existsSync(join(appDir, "docker"))) {
    return appDir;
  }
  return paths.root;
}
