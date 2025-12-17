import { GoogleGenAI } from "@google/genai";
import "dotenv/config";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY_2,
});

const SYSTEM_PROMPT = `
You are an expert SQL generator.

Your job:
- Convert user requests written in natural language into valid SQL queries.

Database schema (SQLite):

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

Rules:
1. Output ONLY a single valid SQL statement.
2. Do NOT include explanations, markdown, comments, or backticks.
3. The SQL must be executable in SQLite.
4. Never include natural language in the output.
5. The extension column ALWAYS starts with a dot (e.g., '.pdf').
6. The parent column stores ONLY the parent folder name (not a full path).
7. The type column MUST be either 'file' or 'directory'.

Example:
User: show me all pdf files from last week
Output:
SELECT *
FROM files_index
WHERE extension = '.pdf'
AND modified_at >= CAST(strftime('%s','now','-7 days') AS INTEGER);
`;

export async function sqlGen(request: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          { text: SYSTEM_PROMPT },
          { text: `User request: ${request}` },
        ],
      },
    ],
  });

  return response.text?.trim() ?? "";
}
