import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { connectCommandStream } from "@/api/index.js";

interface LogsContextValue {
  liveLog: string | null;
  isStreaming: boolean;
}

const LogsContext = createContext<LogsContextValue | null>(null);

export function LogsProvider({ children }: { children: React.ReactNode }) {
  const [liveLog, setLiveLog] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const streamRef = useRef(false);

  useEffect(() => {
    let abortController: AbortController | null = null;

    function checkStream() {
      if (streamRef.current) {
        // Abort the previous stream if it's still running
        abortController?.abort();
      }
      abortController = new AbortController();
      streamRef.current = true;
      setIsStreaming(true);
      setLiveLog(null); // Clear previous command logs when a new one starts
      connectCommandStream(
        (chunk) => {
          setLiveLog((prev) => {
            const newLog = (prev ?? "") + chunk;
            // Cap buffer at ~20,000 characters to prevent memory explosion on extremely long commands
            if (newLog.length > 20000) {
              return newLog.slice(newLog.length - 20000);
            }
            return newLog;
          });
        },
        (code) => {
          setLiveLog((prev) => (prev ?? "") + `\n[Done (exit ${code})]`);
          streamRef.current = false;
          setIsStreaming(false);
        },
        () => {
          streamRef.current = false;
          setIsStreaming(false);
        },
        abortController.signal
      );
    }
    
    // Auto-connect if there is already a stream when the app mounts
    checkStream();

    // Listen to command-started events to re-trigger checking
    window.addEventListener("command-started", checkStream);
    return () => {
      window.removeEventListener("command-started", checkStream);
      abortController?.abort();
    };
  }, []);

  return (
    <LogsContext.Provider value={{ liveLog, isStreaming }}>
      {children}
    </LogsContext.Provider>
  );
}

export function useLogs() {
  const context = useContext(LogsContext);
  if (!context) {
    throw new Error("useLogs must be used within a LogsProvider");
  }
  return context;
}
