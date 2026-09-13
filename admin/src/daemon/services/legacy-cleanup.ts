import { existsSync, writeFileSync } from "fs";
import { join } from "path";
import type { Paths } from "../core/types";

/**
 * Removes the containers and volume left behind by the pre-citron execution engine.
 *
 * Upgrading replaces the old compose file, which means `docker compose down` can no
 * longer see those services — they would keep running, holding ports and memory, with
 * nothing left in the project that knows how to stop them. This finds them by name
 * instead and removes them once, recording a marker so it never runs again.
 */
export async function cleanupLegacyEngine(paths: Paths, logger: { info: (m: string) => void }) {
    const marker = join(paths.runtimeDir, ".legacy-engine-removed");
    if (existsSync(marker)) return;

    const removed: string[] = [];

    try {
        const containers = await listLegacyContainers();
        if (containers.length > 0) {
            await run(["docker", "rm", "-f", ...containers]);
            removed.push(...containers);
        }

        for (const volume of await listLegacyVolumes()) {
            // A volume still attached to something is not ours to delete; ignore the
            // failure rather than blocking startup.
            if (await run(["docker", "volume", "rm", volume])) removed.push(volume);
        }
    } catch (err) {
        // Cleanup is best-effort. Docker being unavailable must not stop the daemon.
        logger.info(`legacy engine cleanup skipped: ${(err as Error).message}`);
        return;
    }

    if (removed.length > 0) {
        logger.info(`removed legacy execution engine resources: ${removed.join(", ")}`);
    }
    writeFileSync(marker, new Date().toISOString());
}

async function listLegacyContainers(): Promise<string[]> {
    const proc = Bun.spawn(
        ["docker", "ps", "-a", "--filter", "name=judge0", "--format", "{{.Names}}"],
        { stdout: "pipe", stderr: "pipe" },
    );
    const out = await new Response(proc.stdout).text();
    await proc.exited;
    return out.split("\n").map((l) => l.trim()).filter(Boolean);
}

async function listLegacyVolumes(): Promise<string[]> {
    const proc = Bun.spawn(
        ["docker", "volume", "ls", "--filter", "name=judge0-data", "--format", "{{.Name}}"],
        { stdout: "pipe", stderr: "pipe" },
    );
    const out = await new Response(proc.stdout).text();
    await proc.exited;
    return out.split("\n").map((l) => l.trim()).filter(Boolean);
}

async function run(cmd: string[]): Promise<boolean> {
    const proc = Bun.spawn(cmd, { stdout: "pipe", stderr: "pipe" });
    return (await proc.exited) === 0;
}
