// src/electron/main.ts
import { app, BrowserWindow, ipcMain } from "electron";
import { join } from "path";
import { isDev } from "./util.js";
import { getPreloadPath } from "./pathResolver.js";
import { initDB } from "./db/db.js";
import { getRootScanPaths } from "./db/getRoots.js";
import { scanDirectory } from "./db/scanner.js";
import { runCompositionalChain } from "./api/functionCall.js"; // ✅ new compositional AI module

// -------------------- APP SETUP --------------------

app.whenReady().then(async () => {
  // --- Initialize Database ---
  initDB();
  console.log("[DB] Ready and connected.");

  // --- Start File Indexing ---
  const roots = getRootScanPaths();
  console.log("[Scan] Starting file indexing:", roots);

  for (const root of roots) {
    console.log(`[Scan] Scanning root: ${root}`);
    try {
      await scanDirectory(root);
    } catch (err) {
      console.error(`[Scan] Error scanning root ${root}:`, err);
    }
  }

  // --- Create Main Window ---
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: getPreloadPath(),
    },
  });

  if (isDev()) {
    await mainWindow.loadURL("http://localhost:5432");
    mainWindow.webContents.openDevTools();
  } else {
    await mainWindow.loadFile(join(app.getAppPath(), "/dist-react/index.html"));
  }

  console.log("[App] Main window loaded!");

  // -------------------- IPC: AI CHAT HANDLER --------------------

  /**
   * Handles natural-language AI queries from the frontend (FloatingTextBar).
   * This triggers the compositional Gemini function chain:
   * sqlgen → exeSQL → displaySQL
   */
  ipcMain.handle("ai:chat-sql", async (_event, userQuery: string) => {
    console.log("[AI] Received query:", userQuery);

    try {
      const finalResponse = await runCompositionalChain(userQuery);

      return {
        success: true,
        result: finalResponse, // what AI said at the end
      };
    } catch (err: any) {
      console.error("[AI] Error during compositional chain:", err);
      return { success: false, error: err.message ?? "Unknown AI error" };
    }
  });
});

// -------------------- GRACEFUL SHUTDOWN --------------------

app.on("before-quit", () => {
  try {
    const { closeDB } = require("./db/db.js");
    closeDB();
    console.log("[DB] Closed cleanly.");
  } catch (err) {
    console.warn("[DB] Failed to close cleanly:", err);
  }
});
