import { createApiHandler } from "./api";
import { serveUi } from "./ui";
import type { Paths } from "../core/types";

export function createRequestHandler(paths: Paths) {
  const handleApi = createApiHandler(paths);

  return async function handleRequest(req: Request) {
    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method.toUpperCase();

    if (path.startsWith("/api/")) {
      return handleApi(req, url, method);
    }

    return serveUi(paths, path, req);
  };
}
