import { app, BrowserWindow, Menu } from "electron";
import { join } from "path";
import { isDev } from "./util.js";



app.on("ready", () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  Menu.setApplicationMenu(null);

  if (isDev()) {
    mainWindow.loadURL("http://localhost:5432");
  } else {
    mainWindow.loadFile(join(app.getAppPath(), "/dist-react/index.html"));
  }

  
});
