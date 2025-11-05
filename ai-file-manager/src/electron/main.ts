import { app, BrowserWindow} from "electron";
import { join } from "path";
import { isDev } from "./util.js";
import { getPreloadPath } from "./pathResolver.js";
import "./db/db.cjs"; // initialize database on startup

//Scanner + Root Finder
import { getRootScanPaths } from "./db/getRoots.cjs";
import { scanDirectory } from "./db/scanner.cjs";



app.on("ready", () => {
  const roots = getRootScanPaths();
  console.log("Starting file indexing... : ",roots);

  roots.forEach(root => {
    scanDirectory(root).catch(console.error);
  });


  //open UI after
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: getPreloadPath(),
    },
  });

  // Menu.setApplicationMenu(null);

  if (isDev()) {
    mainWindow.loadURL("http://localhost:5432");
  } else {
    mainWindow.loadFile(join(app.getAppPath(), "/dist-react/index.html"));
  }

  
});
