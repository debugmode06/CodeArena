#!/usr/bin/env node
import { spawn, spawnSync, execSync } from "node:child_process";
import fs from "node:fs";

const isWindows = process.platform === "win32";
const shell = true;

const noDockerFlag = process.argv.includes("--no-docker") || process.env.NO_DOCKER === "1";

const required = [
  { cmd: "bun",    args: ["--version"], name: "Bun",      hint: isWindows ? "winget install Oven-sh.Bun  or  https://bun.sh" : "curl -fsSL https://bun.sh/install | bash" },
  { cmd: "pnpm",   args: ["--version"], name: "pnpm",     hint: "npm install -g pnpm" },
  { cmd: "node",   args: ["--version"], name: "Node.js",  hint: "https://nodejs.org" },
];

let missing = false;
for (const tool of required) {
  const res = spawnSync(tool.cmd, tool.args, { stdio: "pipe", shell: true });
  if (res.status !== 0 || res.error) {
    console.error(`\x1b[31m✖ ${tool.name} is not available or not running.\x1b[0m`);
    console.error(`  → ${tool.hint}\n`);
    missing = true;
  } else {
    const version = res.stdout?.toString().trim().split("\n")[0] ?? "";
    console.log(`\x1b[32m✔ ${tool.name}\x1b[0m${version ? `  (${version})` : ""}`);
  }
}

if (missing) {
  console.error("\n\x1b[31mOne or more required tools are missing. Please install them and try again.\x1b[0m");
  process.exit(1);
}

// Check Docker
let useDocker = !noDockerFlag;
if (useDocker) {
  const dockerRes = spawnSync("docker", ["info"], { stdio: "pipe", shell: true });
  if (dockerRes.status !== 0 || dockerRes.error) {
    useDocker = false;
    console.log(`\x1b[33m⚠ Docker is not available or not running. Running in no-docker mode.\x1b[0m`);
  } else {
    const versionRes = spawnSync("docker", ["--version"], { stdio: "pipe", shell: true });
    const version = versionRes.stdout?.toString().trim().split("\n")[0] ?? "";
    console.log(`\x1b[32m✔ Docker\x1b[0m${version ? `  (${version})` : ""}`);
  }
} else {
  console.log(`\x1b[33mℹ Running in no-docker mode (--no-docker specified).\x1b[0m`);
}

if (!useDocker) {
  let envContent = "";
  try {
    envContent = fs.readFileSync(".env", "utf8");
  } catch {}
  const match = envContent.match(/^MONGODB_URI=(.*)$/m);
  const mongoUri = match ? match[1].trim() : (process.env.MONGODB_URI || "mongodb://localhost:27017/pomelo");
  const maskedUri = mongoUri.replace(/\/\/[^:]+:[^@]+@/, "//***:***@");
  console.log(`\x1b[36mℹ Database:\x1b[0m Using ${maskedUri}`);
  console.log(`\x1b[36mℹ Code Execution:\x1b[0m Starting mock Citron on port 2358\n`);
}

console.log("");

let mockCitronChild = null;
let torndown = false;
function teardown() {
  if (torndown) return;
  torndown = true;
  if (isWindows && child?.pid) {
    try { execSync(`taskkill /F /T /PID ${child.pid}`, { stdio: "pipe" }); } catch {}
  }
  if (isWindows && mockCitronChild?.pid) {
    try { execSync(`taskkill /F /T /PID ${mockCitronChild.pid}`, { stdio: "pipe" }); } catch {}
  } else if (mockCitronChild?.pid) {
    try { mockCitronChild.kill("SIGTERM"); } catch {}
  }
  if (useDocker) {
    console.log("\n\x1b[33mStopping dev infrastructure…\x1b[0m");
    spawnSync("pnpm", ["dev:down"], { stdio: "inherit", shell });
  }
}

function run(cmd, args) {
  const res = spawnSync(cmd, args, { stdio: "inherit", shell });
  if (res.status !== 0) process.exit(res.status ?? 1);
}

if (useDocker) {
  run("pnpm", ["dev:infra"]);
} else {
  // Start mock Citron judge in the background
  mockCitronChild = spawn("node", ["scripts/mock-citron.mjs"], { stdio: "inherit", shell });
}

run("pnpm", ["--filter", "@pomelo/code-gen", "build"]);

const passArgs = process.argv.slice(2).filter(arg => arg !== "--no-docker");
let child = spawn("pnpm", ["exec", "turbo", "run", "dev", ...passArgs], { stdio: "inherit", shell, detached: false });

if (isWindows) {
  process.on("SIGINT", () => { teardown(); process.exit(0); });
  process.on("SIGTERM", () => { teardown(); process.exit(0); });
} else {
  for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => {});
}

process.on("exit", teardown);
child.on("exit", (code) => process.exit(code ?? 0));

