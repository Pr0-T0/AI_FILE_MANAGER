// src/electron/preload.ts
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  /**
   * Sends a natural-language query from the frontend to the main process.
   * The main process (functionCall.ts) runs the compositional AI chain:
   * sqlgen → exeSQL → displaySQL
   */
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
