import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

export async function createSQLChatSession() {
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY_2,
  });

  const chat = ai.chats.create({
    model: "gemini-2.5-flash",
    history: [
      {
        role: "user",
        parts: [
          {
            text: `
You are an expert SQL generator.

Your job:
- Convert user requests written in natural language into valid SQL queries.
- The database schema is:

Table: files_index
Columns:
- path TEXT
- name TEXT
- parent TEXT
- type TEXT
- extension TEXT
- size INTEGER
- created_at INTEGER
- modified_at INTEGER

Output rules:
1. Output ONLY the SQL statement.
2. Do NOT include any explanations, descriptions, markdown, or backticks.
3. The response must be a single valid SQL command suitable for execution in SQLite.
4. Never include words like "Here is your SQL" or "SELECT statement".
5. Keep context across turns and modify only if the user reports an error or requests a change.
6. The extension column always starts with a dot like .pdf
7. The parent column contains ther absolute path of the parent folder

Example:
User: show me all pdf files from last week
Output:
SELECT * FROM files WHERE extension='pdf' AND modified_at >= strftime('%s','now','-7 days');
            `,
          },
        ],
      },
      {
        role: "model",
        parts: [
          {
            text: "Understood. I will only output SQL statements, without any explanations.",
          },
        ],
      },
    ],
  });

  console.log("[AI] SQL chat session initialized (strict SQL-only mode).");
  return chat;
}
