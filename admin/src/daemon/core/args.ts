export type DaemonArgs = {
  daemonize: boolean;
  root?: string;
  host?: string;
  port?: number;
  appCompose?: string;
  citronCompose?: string;
};

export function parseArgs(argv: string[]): DaemonArgs {
  const out: DaemonArgs = { daemonize: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--daemon") {
      out.daemonize = true;
      continue;
    }
    if (arg === "--foreground") {
      out.daemonize = false;
      continue;
    }
    if (arg === "--root") {
      out.root = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === "--host") {
      out.host = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === "--port") {
      out.port = Number(argv[i + 1]);
      i += 1;
      continue;
    }
    if (arg === "--app-compose") {
      out.appCompose = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === "--citron-compose") {
      out.citronCompose = argv[i + 1];
      i += 1;
      continue;
    }
  }
  return out;
}
