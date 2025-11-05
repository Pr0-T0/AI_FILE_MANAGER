import { app, BrowserWindow} from "electron";
import { join } from "path";
import { isDev } from "./util.js";
import { getPreloadPath } from "./pathResolver.js";
import "./db.cjs"; // initialize database on startup



app.on("ready", () => {
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
