export type OperationState = {
  status: "idle" | "running";
  name?: string;
  startedAt?: string;
  exitCode?: number;
};

const currentOperation: OperationState = { status: "idle" };

let logBuffer = "";
type LogSubscriber = {
  onChunk: (chunk: string) => void;
  onExit: (code: number) => void;
};
const subscribers: Set<LogSubscriber> = new Set();

export function getOperationState() {
  return currentOperation;
}

export function isOperationRunning() {
  return currentOperation.status === "running";
}

export function getLogBuffer() {
  return logBuffer;
}

export function subscribeToLogs(subscriber: LogSubscriber) {
  subscribers.add(subscriber);
  return () => {
    subscribers.delete(subscriber);
  };
}

export function markOperationRunning(name: string) {
  currentOperation.status = "running";
  currentOperation.name = name;
  currentOperation.startedAt = new Date().toISOString();
  delete currentOperation.exitCode;
  logBuffer = ""; // Reset logs on new operation
}

export function appendOperationLog(chunk: string) {
  logBuffer += chunk;
  for (const sub of subscribers) {
    try {
      sub.onChunk(chunk);
    } catch {}
  }
}

export function markOperationFinished(exitCode: number) {
  currentOperation.status = "idle";
  currentOperation.exitCode = exitCode;
  
  for (const sub of subscribers) {
    try {
      sub.onExit(exitCode);
    } catch {}
  }
  subscribers.clear();
}
