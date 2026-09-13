export type Paths = {
  root: string;
  apiHost: string;
  apiPort: number;
  configDir: string;
  dataDir: string;
  runtimeDir: string;
  logsDir: string;
  tmpDir: string;
  uiDistDir: string;
  envFile: string;
  configFile: string;
  caddyFile: string;
  citronConfFile: string;
  citronLanguagesFile: string;
};

export type Logger = {
  info: (message: string) => void;
  error: (message: string) => void;
};
