import { useEffect, useState } from "react";

export type LogLevel = "info" | "warn" | "error" | "debug";

export interface LogEntry {
  level: LogLevel;
  message: string;
  meta?: any;
  timestamp: string;
}

declare global {
  interface Window {
    logger: {
      onLog: (cb: (log: LogEntry) => void) => void;
      offLog?: (cb: (log: LogEntry) => void) => void;
    };
  }
}

export function useLogger() {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    if (!window.logger) {
      console.warn("Logger not available (preload not connected)");
      return;
    }

    const handler = (log: LogEntry) => {
      setLogs((prev) => {
        const next = [...prev, log];
        // prevent memory blow-up
        return next.length > 1000 ? next.slice(-1000) : next;
      });
    };

    window.logger.onLog(handler);

    return () => {
      window.logger.offLog?.(handler);
    };
  }, []);

  return logs;
}
