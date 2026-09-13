import { getDevConfig } from "../core/dev";

/**
 * Proxies non-API UI requests to the Vite dev server for live Hot Module Replacement (HMR).
 * Returns Response if successfully proxied, or null if dev server is unreachable or disabled.
 */
export async function proxyDevUi(pathname: string, req?: Request): Promise<Response | null> {
  const { isDev, viteUrl } = getDevConfig();
  if (!isDev) return null;

  try {
    const targetUrl = `${viteUrl}${pathname}`;
    const res = await fetch(targetUrl, {
      headers: req ? Object.fromEntries(req.headers) : undefined,
    });

    if (res.ok || res.status === 304) {
      return new Response(res.body, {
        status: res.status,
        headers: res.headers,
      });
    }
  } catch {
    // If Vite dev server is offline or unreachable, return null to fallback to static dist
  }

  return null;
}
