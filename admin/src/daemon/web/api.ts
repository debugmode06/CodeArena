import { existsSync, readFileSync } from "fs";
import YAML from "yaml";
import { logsResponse, startCompose } from "../services/compose";
import { ComposeCommand } from "../services/compose-command";
import { getConfigSnapshot, updateConfig, validateConfig, parseConfigYaml, ensureConfigDefaults, parseEnv } from "../core/config";
import { getCurrentReleaseDir } from "../core/release";
import { errorResponse, json, normalizeError, readJson } from "./http";
import { getStatus, getStorageUsage } from "../services/status";
import { startUninstall } from "../services/uninstall";
import { createUser, deleteUser, listUsers, updateUser } from "../services/users";
import { isOperationRunning, getOperationState, getLogBuffer, subscribeToLogs } from "../services/operations";
import { validateMongoConnection } from "../services/db-check";
import type { Paths } from "../core/types";

/**
 * Determine the correct restart action and Caddy handling after config changes.
 */
function determineRestartAction(
  paths: Paths,
  body: any,
  currentConfig: ReturnType<typeof getConfigSnapshot>,
): "none" | "restart-all" | "reload-caddy" | "restart-caddy" | "restart-citron" | "restart-daemon" {
  const appEnvChanged = typeof body.appEnv === "string" && body.appEnv !== currentConfig.appEnv;
  const configYamlChanged = typeof body.configYaml === "string" && body.configYaml !== currentConfig.configYaml;
  const caddyfileChanged = typeof body.caddyfile === "string" && body.caddyfile !== currentConfig.caddyfile;
  const citronChanged =
    (typeof body.citron === "string" && body.citron !== currentConfig.citron) ||
    (typeof body.citronLanguages === "string" && body.citronLanguages !== currentConfig.citronLanguages);

  if (configYamlChanged) {
    const oldCfg = parseConfigYaml(paths) || {};
    let newCfg: any = {};
    try {
      newCfg = YAML.parse(body.configYaml) || {};
    } catch {}

    // Admin port change — daemon must restart to bind to the new port
    const oldAdminPort = oldCfg.ports?.admin ?? 8462;
    const newAdminPort = newCfg.ports?.admin ?? 8462;
    if (oldAdminPort !== newAdminPort) {
      return "restart-daemon";
    }

    const oldHttpPort = oldCfg.ports?.caddyHttp ?? 80;
    const oldHttpsPort = oldCfg.ports?.caddyHttps ?? 443;
    const newHttpPort = newCfg.ports?.caddyHttp ?? 80;
    const newHttpsPort = newCfg.ports?.caddyHttps ?? 443;

    if (oldHttpPort !== newHttpPort || oldHttpsPort !== newHttpsPort) {
      return "restart-all";
    }
  }

  // If core app config or env changed, full restart is needed
  if (appEnvChanged || configYamlChanged) {
    return "restart-all";
  }

  if (caddyfileChanged && citronChanged) {
    return "restart-all";
  }
  if (caddyfileChanged) {
    return "reload-caddy";
  }
  if (citronChanged) {
    return "restart-citron";
  }

  return "none";
}

async function runPreStartChecks(paths: Paths): Promise<Response | null> {
  const cfgYaml = parseConfigYaml(paths) || {};
  if (cfgYaml.infrastructure?.database?.mode === "external") {
    const appEnvText = existsSync(paths.envFile) ? readFileSync(paths.envFile, "utf8") : "";
    const mongoUri = parseEnv(appEnvText)["MONGODB_URI"];
    if (mongoUri) {
      try {
        await validateMongoConnection(mongoUri);
      } catch (err: any) {
        return errorResponse(
          `Cannot connect to external MongoDB at ${mongoUri}. Check MONGODB_URI in app.env. (${err.message})`,
          1,
          400,
        );
      }
    }
  }
  return null;
}

export function createApiHandler(paths: Paths) {
  return async function handleApi(req: Request, url: URL, method: string) {
    try {
      if (method === "GET" && url.pathname === "/api/health") {
        return json({ status: "ok" });
      }

      if (method === "GET" && url.pathname === "/api/status") {
        return json({ status: "ok", data: await getStatus(paths) });
      }

      if (method === "GET" && url.pathname === "/api/command/stream") {
        const state = getOperationState();
        if (state.status === "idle" && state.exitCode === undefined) {
          return json({ status: "idle" });
        }

        const encoder = new TextEncoder();
        let cleanup: (() => void) | undefined;

        const stream = new ReadableStream({
          start(controller) {
            const sendChunk = (text: string) => {
              try {
                controller.enqueue(encoder.encode(text));
              } catch {}
            };

            // Send past logs immediately
            const buffer = getLogBuffer();
            if (buffer) sendChunk(buffer);

            if (!isOperationRunning()) {
              sendChunk(`\n[POMELO_EXIT:${state.exitCode ?? 0}]\n`);
              controller.close();
              return;
            }

            cleanup = subscribeToLogs({
              onChunk: (chunk) => sendChunk(chunk),
              onExit: (code) => {
                sendChunk(`\n[POMELO_EXIT:${code}]\n`);
                try { controller.close(); } catch {}
              },
            });
          },
          cancel() {
            cleanup?.();
          },
        });

        return new Response(stream, {
          headers: { 
            "content-type": "text/event-stream; charset=utf-8",
            "cache-control": "no-cache",
            "connection": "keep-alive",
          },
        });
      }

      if (method === "POST" && url.pathname === "/api/start") {
        ensureConfigDefaults(paths, getCurrentReleaseDir(paths));

        const preCheckError = await runPreStartChecks(paths);
        if (preCheckError) return preCheckError;

        const compose = ComposeCommand.from(paths);
        await startCompose(paths, "start", [
          { label: "Stopping existing containers...", descriptor: ComposeCommand.forTeardown(paths).downKeepVolumes() },
          { descriptor: compose.up() },
        ]);
        return json({ status: "ok" });
      }

      if (method === "POST" && url.pathname === "/api/stop") {
        await startCompose(paths, "stop", [
          { descriptor: ComposeCommand.forTeardown(paths).stop() },
        ]);
        return json({ status: "ok" });
      }

      if (method === "POST" && url.pathname === "/api/restart") {
        const body = await readJson(req);
        const target = body?.target; // "all" | "caddy" | "caddy-restart" | "citron"
        const compose = ComposeCommand.from(paths);

        if (target === "caddy") {
          await startCompose(paths, "restart", [
            { descriptor: compose.reloadCaddy() },
          ]);
        } else if (target === "caddy-restart") {
          await startCompose(paths, "restart", [
            { descriptor: compose.restartCaddy() },
          ]);
        } else if (target === "citron") {
          await startCompose(paths, "restart", [
            { descriptor: compose.restartServices("citron") },
          ]);
        } else {
          // "all" or unspecified — down then up with caddy reload
          ensureConfigDefaults(paths, getCurrentReleaseDir(paths));

          const preCheckError = await runPreStartChecks(paths);
          if (preCheckError) {
            await startCompose(paths, "stop", [
              { descriptor: ComposeCommand.forTeardown(paths).stop() },
            ]);
            return preCheckError;
          }

          await startCompose(paths, "restart", [
            { label: "Stopping existing containers...", descriptor: ComposeCommand.forTeardown(paths).downKeepVolumes() },
            { descriptor: compose.up() },
          ]);
        }
        return json({ status: "ok" });
      }

      if (method === "GET" && url.pathname === "/api/logs") {
        return logsResponse(paths, url.searchParams);
      }

      if (method === "GET" && url.pathname === "/api/config") {
        return json({ status: "ok", data: getConfigSnapshot(paths) });
      }

      if (method === "PUT" && url.pathname === "/api/config") {
        const body = await readJson(req);
        const currentConfig = getConfigSnapshot(paths);
        const restartAction = determineRestartAction(paths, body, currentConfig);

        updateConfig(paths, body);

        if (restartAction === "restart-daemon") {
          // Respond first, then exit — systemd Restart=always will bring daemon back on new port
          setTimeout(() => process.exit(0), 500);
        }

        return json({ status: "ok", data: { saved: true, restartAction } });
      }

      if (method === "POST" && url.pathname === "/api/config/validate") {
        return json({ status: "ok", data: validateConfig(paths) });
      }

      if (method === "POST" && url.pathname === "/api/test-connection") {
        const body = await readJson(req);
        if (body?.type === "mongo") {
          try {
            await validateMongoConnection(body.uri);
            return json({ status: "ok" });
          } catch (err: any) {
            return errorResponse(err.message, 1, 400);
          }
        }
        return errorResponse("Unsupported connection type", 1, 400);
      }

      if (method === "POST" && url.pathname === "/api/uninstall") {
        if (isOperationRunning()) {
          return errorResponse("Another operation is in progress", 1);
        }
        const body = await readJson(req);
        // Start uninstall in the background
        startUninstall(paths, body.mode).catch(console.error);
        return json({ status: "ok" });
      }

      if (method === "GET" && url.pathname === "/api/storage") {
        return json({ status: "ok", data: await getStorageUsage(paths) });
      }

      if (method === "GET" && url.pathname === "/api/users") {
        const role = url.searchParams.get("role") || undefined;
        const page = Number(url.searchParams.get("page") || "1");
        const limit = Number(url.searchParams.get("limit") || "10");
        return json({
          status: "ok",
          data: await listUsers(paths, { role, page, limit }),
        });
      }

      if (method === "POST" && url.pathname === "/api/users") {
        const body = await readJson(req);
        return json({ status: "ok", data: await createUser(paths, body) }, 201);
      }

      const userMatch = url.pathname.match(/^\/api\/users\/([a-f0-9]{24})$/);
      if (userMatch) {
        const userId = userMatch[1];
        if (method === "PUT") {
          const body = await readJson(req);
          return json({
            status: "ok",
            data: await updateUser(paths, userId, body),
          });
        }
        if (method === "DELETE") {
          await deleteUser(paths, userId);
          return json({ status: "ok", data: { deleted: true } });
        }
      }

      return errorResponse("Not found", 1, 404);
    } catch (err) {
      const { message, code } = normalizeError(err);
      return errorResponse(message, code ?? 1, 500);
    }
  };
}
