// stdbuf line-buffers piped output on Linux only; passthrough elsewhere (macOS/Windows lack coreutils)
export function withLineBuffering(cmd: string[]): string[] {
  return process.platform === "linux" ? ["stdbuf", "-oL", "-eL", ...cmd] : cmd;
}

export async function run(
  cmd: string,
  args: string[],
  options: Record<string, any> = {},
) {
  const proc = Bun.spawn({
    cmd: [cmd, ...args],
    cwd: options.cwd,
    env: options.env ?? process.env,
    stdout: "pipe",
    stderr: "pipe",
  });

  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ]);

  const code = await proc.exited;
  return { code, stdout, stderr };
}
