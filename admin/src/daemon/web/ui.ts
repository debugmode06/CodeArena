import { existsSync, lstatSync } from "fs";
import { join } from "path";
import { proxyDevUi } from "./dev-proxy";
import type { Paths } from "../core/types";

export async function serveUi(paths: Paths, pathname: string, req?: Request) {
  const devResponse = await proxyDevUi(pathname, req);
  if (devResponse) return devResponse;

  const dist = paths.uiDistDir;
  if (!existsSync(dist)) {
    return new Response("UI build not found", { status: 404 });
  }

  const requested = pathname === "/" ? "index.html" : pathname.slice(1);
  const filePath = join(dist, requested);
  // Guard against path traversal: resolved path must stay within dist
  if (!filePath.startsWith(dist + "/") && filePath !== dist) {
    return new Response("Forbidden", { status: 403 });
  }
  if (existsSync(filePath) && !lstatSync(filePath).isDirectory()) {
    return new Response(Bun.file(filePath));
  }

  const indexPath = join(dist, "index.html");
  if (existsSync(indexPath)) {
    return new Response(Bun.file(indexPath));
  }

  return new Response("UI not available", { status: 404 });
}
