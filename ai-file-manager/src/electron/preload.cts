// src/electron/preload.ts
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  aiQuery: async (userQuery: string) => {
    try {
      return await ipcRenderer.invoke("ai:chat-sql", userQuery);
    } catch (error: any) {
      console.error("[Preload] aiQuery error:", error);
      return {
        kind: "aggregate",
        metric: "error",
        value: error.message ?? "Unknown error",
      };
    }
  },
});


contextBridge.exposeInMainWorld("settingsAPI", {
  get: () => ipcRenderer.invoke("settings:get"),
  set: (settings: any) => ipcRenderer.invoke("settings:set", settings),
  pickFolder: () => ipcRenderer.invoke("settings:pickFolder"),
});

contextBridge.exposeInMainWorld("rescanAPI", {
  rescan: () => ipcRenderer.invoke("scan:rescan"),
});

contextBridge.exposeInMainWorld("lanAPI", {
  getDevices: () => ipcRenderer.invoke("lan:getDevices"),
});