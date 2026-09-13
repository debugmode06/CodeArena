#!/usr/bin/env bun
import { runCli } from "./cli/main";

await runCli(Bun.argv.slice(2));
