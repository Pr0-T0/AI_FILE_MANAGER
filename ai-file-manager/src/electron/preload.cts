import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  // existing test function
  getStaticData: () => console.log("static"),

  //  SQL executor bridge
  executeSQL: async (sql: string, params: any[] = []) => {
    // Send query to the main process and await result
    return await ipcRenderer.invoke("execute-sql", { sql, params });
  },
});
