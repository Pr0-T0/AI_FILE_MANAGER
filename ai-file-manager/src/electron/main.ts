import {app, BrowserWindow, Menu} from "electron"
import path from "path";
import { isDev } from "./util.js";


app.on("ready", () => {
    const mainWindow = new BrowserWindow({});

    Menu.setApplicationMenu(null);

    if (isDev()) {
        mainWindow.loadURL('http://localhost:5432');
    }else{
        mainWindow.loadFile(path.join(app.getAppPath(), '/dist-react/index.html'));
    }    
});

