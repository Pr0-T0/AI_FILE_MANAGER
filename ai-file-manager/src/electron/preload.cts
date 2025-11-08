import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  // existing test function
  getStaticData: () => console.log("static"),

  // send a query to Gemini (IPC call)
  sendQuery: (prompt: string) => ipcRenderer.invoke("ai:query", prompt),

  // receive Gemini's response
  onGeminiResponse: (callback: (text: string) => void) =>
    ipcRenderer.on("ai:query:response", (_event, data) => callback(data)),

  // handle Gemini errors
  onGeminiError: (callback: (error: string) => void) =>
    ipcRenderer.on("ai:query:error", (_event, error) => callback(error)),
});
