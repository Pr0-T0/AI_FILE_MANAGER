import { GoogleGenAI } from "@google/genai";
import "dotenv/config";
import { ipcMain, BrowserWindow } from "electron";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function runGeminiQuery(prompt: string): Promise<string> {
  const result = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
  });
  return result.text || "No response from Gemini.";
}

// Expose this to main process
export function setupGeminiIPC(mainWindow: BrowserWindow) {
  ipcMain.handle("ai:query", async (_event, prompt: string) => {
    try {
      const response = await runGeminiQuery(prompt);
      mainWindow.webContents.send("ai:query:response", response);
      return response;
    } catch (err: any) {
      const errorMsg = `Gemini error: ${err.message}`;
      mainWindow.webContents.send("ai:query:error", errorMsg);
      return errorMsg;
    }
  });
}
