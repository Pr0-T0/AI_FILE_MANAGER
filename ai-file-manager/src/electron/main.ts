// main.ts
import { app, BrowserWindow, ipcMain } from "electron";
import { join } from "path";
import { isDev } from "./util.js";
import { getPreloadPath } from "./pathResolver.js";
import { initDB } from "./db/db.js"; //  import init function, not auto-run DB
import { getRootScanPaths } from "./db/getRoots.js";
import { scanDirectory } from "./db/scanner.js";
import { executeSQL } from "./db/exeSQL.js";

app.whenReady().then(async () => {
  // Initialize the database safely after Electron is ready
  initDB();
  console.log("[DB] Ready and connected.");

  // Start file indexing after DB is ready
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

  // Create main window after indexing begins
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

  // Optional: open DevTools in development : this opens the console auitomatically
  if (isDev()) mainWindow.webContents.openDevTools();

  console.log("Main window loaded!");


  ipcMain.handle("execute-sql", async (_event, { sql, params }) => {
    try {
      const result = executeSQL(sql, params);
      return result; // already structured as { success, rows?, info?, error? }
    } catch (error: any) {
      console.error(" IPC SQL Error:", error.message);
      return { success: false, error: error.message };
    }
  });

});

//Gracefully close DB before quitting
app.on("before-quit", () => {
  try {
    const { closeDB } = require("./db/db.js");
    closeDB();
  } catch (err) {
    console.warn("Failed to close DB cleanly:", err);
  }
});
