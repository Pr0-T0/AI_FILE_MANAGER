import { BrowserWindow } from "electron";

type LogLevel = "info" | "warn" | "error" | "debug";

export function log(
  level: LogLevel,
  message: string,
  meta?: any
) {
  const payload = {
    level,
    message,
    meta,
    timestamp: new Date().toISOString(),
  };

  // Send to all open windows
  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.send("log:event", payload);
  });

  // Also log to terminal
  console[level === "error" ? "error" : "log"](
    `[${level.toUpperCase()}]`,
    message,
    meta ?? ""
  );
}
