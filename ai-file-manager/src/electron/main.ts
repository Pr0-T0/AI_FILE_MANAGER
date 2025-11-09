// main.ts
import { app, BrowserWindow, ipcMain } from "electron";
import { join } from "path";
import { isDev } from "./util.js";
import { getPreloadPath } from "./pathResolver.js";
import { initDB } from "./db/db.js";
import { getRootScanPaths } from "./db/getRoots.js";
import { scanDirectory } from "./db/scanner.js";
import { createSQLChatSession } from "./api/sqlGen.js";

let chat: Awaited<ReturnType<typeof createSQLChatSession>> | null = null;

app.whenReady().then(async () => {
  // Initialize database
  initDB();
  console.log("[DB] Ready and connected.");

  // Start file indexing
  const roots = getRootScanPaths();
  console.log("Starting file indexing:", roots);

  for (const root of roots) {
    console.log(`Scanning root: ${root}`);
    try {
      await scanDirectory(root);
    } catch (err) {
      console.error("Error scanning root:", root, err);
    }
  }

  // Create main window
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: getPreloadPath(),
    },
  });

  if (isDev()) {
    await mainWindow.loadURL("http://localhost:5432");
  } else {
    await mainWindow.loadFile(join(app.getAppPath(), "/dist-react/index.html"));
  }

  if (isDev()) mainWindow.webContents.openDevTools();
  console.log("Main window loaded!");

  // Initialize Gemini SQL chat session
  chat = await createSQLChatSession();
  console.log("[AI] Gemini SQL chat session ready.");

  // IPC: AI SQL chat handler
  ipcMain.handle("ai:chat-sql", async (_event, message: string) => {
    if (!chat) {
      chat = await createSQLChatSession();
    }

    console.log("[AI] Received query:", message);

    try {
      const response = await chat.sendMessage({ message });
      const sql = response.text?.trim() || "";
      console.log("[AI] Generated SQL:\n", sql);
      return { success: true, sql };
    } catch (err: any) {
      console.error("[AI] Gemini error:", err.message);
      return { success: false, error: err.message };
    }
  });
});

// Gracefully close DB before quitting
app.on("before-quit", () => {
  try {
    const { closeDB } = require("./db/db.js");
    closeDB();
  } catch (err) {
    console.warn("Failed to close DB cleanly:", err);
  }
});
