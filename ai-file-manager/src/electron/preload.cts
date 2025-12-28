// src/electron/preload.ts
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  //Sends a natural-language query from the frontend to the main process.
  generateSQL: async (userQuery: string) => {
    try {
      const result = await ipcRenderer.invoke("ai:chat-sql", userQuery);
      return result; // expected { success: boolean, result?: any, error?: string }
    } catch (error: any) {
      console.error("[Preload] generateSQL error:", error);
      return { success: false, error: error.message ?? "Unknown error" };
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