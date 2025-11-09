import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  // Example static test function
  getStaticData: () => console.log("static"),

  // Bridge: Ask Gemini (AI) to generate SQL from a natural-language query
  generateSQL: async (userQuery: string) => {
    try {
      // Send the user query to the main process
      const result = await ipcRenderer.invoke("ai:chat-sql", userQuery);
      return result; // { success: boolean, sql?: string, error?: string }
    } catch (error: any) {
      console.error("[Preload] generateSQL error:", error.message);
      return { success: false, error: error.message };
    }
  },
});
