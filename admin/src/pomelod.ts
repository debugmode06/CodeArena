#!/usr/bin/env bun
import { runDaemon } from "./daemon/main";

await runDaemon(Bun.argv.slice(2), import.meta.url);
