import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { executeSQL } from "../db/exeSQL.js";
import { displayResult } from "../test/displaySQL.js";
import "dotenv/config";
import { createSQLChatSession } from "./sqlGen.js";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY_1,
});

// -------------------- SQLGEN USING CHAT SESSION --------------------

let sqlChat: Awaited<ReturnType<typeof createSQLChatSession>> | null = null;

export async function sqlgen({ query }: { query: string }) {
  console.log(`Tool Call: sqlgen(query="${query}")`);

  try {
    if (!sqlChat) {
      sqlChat = await createSQLChatSession();
      console.log("[AI] Created new SQL chat session.");
    }

    // Correct usage per official docs:
    // https://ai.google.dev/gemini-api/docs/chat
    const response = await sqlChat.sendMessage({
      message: query,
    });

    // Extract SQL text
    const sql = response.text?.trim() ?? "";

    if (!sql) {
      console.warn("[sqlgen] No SQL returned.");
      return { sql: "" };
    }

    console.log(`Tool Response (SQL): ${sql}`);
    return { sql };
  } catch (err: any) {
    console.error("[sqlgen] Error:", err.message || err);
    sqlChat = null;
    return { sql: "" };
  }
}

// -------------------- OTHER TOOL FUNCTIONS --------------------

function exeSQL({ sql }: { sql: string }) {
  console.log(`Tool Call: exeSQL(sql="${sql}")`);
  const result = executeSQL(sql);
  console.log(`Tool Response (result): ${JSON.stringify(result, null, 2)}`);
  return { result };
}

function displaySQL({ result }: { result: any }) {
  console.log("Tool Call: displaySQL(result)");
  displayResult(result);
  console.log("Tool Response: { status: 'shown' }");
  return { status: "shown" };
}

const toolFunctions = { sqlgen, exeSQL, displaySQL } as const;

// -------------------- TOOL DECLARATIONS --------------------

const functionDeclarations: FunctionDeclaration[] = [
  {
    name: "sqlgen",
    description:
      "Generates an SQL query string from a natural-language user query about files_index.",
    parameters: {
      type: Type.OBJECT,
      properties: { query: { type: Type.STRING } },
      required: ["query"],
    },
  },
  {
    name: "exeSQL",
    description: "Executes an SQL query on the local database.",
    parameters: {
      type: Type.OBJECT,
      properties: { sql: { type: Type.STRING } },
      required: ["sql"],
    },
  },
  {
    name: "displaySQL",
    description: "Displays SQL execution results and provides a summary.",
    parameters: {
      type: Type.OBJECT,
      properties: { result: { type: Type.OBJECT } },
      required: ["result"],
    },
  },
];

// -------------------- COMPOSITIONAL ORCHESTRATION --------------------

type ChatMessage = {
  role: "user" | "model" | "assistant";
  parts: any[];
};

let lastSQLResult: any[] = [];

export async function runCompositionalChain(userQuery: string) {
  console.log(`\nReceived user query: "${userQuery}"`);

  const contents: ChatMessage[] = [
    {
      role: "user",
      parts: [
        {
          text: `
You are an AI File Manager Controller Named LINC.You also interact with the user in a friendly manner.
Your task is to interpret file-related natural language requests and use the available tools below to complete them:

1. sqlgen(query: string) → converts user query into SQL.
2. exeSQL(sql: string) → executes SQL on the local file database.
3. displaySQL(result: object) → displays the final results.

Rules:
- Always start with sqlgen when the user gives a natural-language request.
- Then call exeSQL with the generated SQL.
- Then call displaySQL with the result.
- Never say "I cannot" or refuse file-related queries.
- Do not attempt to reason about SQL syntax yourself — always use sqlgen for that.
- After all tool calls are complete, respond with a short final message summarizing the action taken.
- You don't need to inspect or summarize the result data; just confirm that execution succeeded before calling displaySQL.
`,
        },
      ],
    },
    { role: "user", parts: [{ text: userQuery }] },
  ];

  while (true) {
    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        tools: [{ functionDeclarations }],
      },
    });

    const candidate = result.candidates?.[0];
    const part = candidate?.content?.parts?.[0];

    if (part && "functionCall" in part && part.functionCall) {
      const call = part.functionCall;
      const { name, args } = call;

      if (!name || !(name in toolFunctions)) {
        console.error(`[AI] Unknown function call: ${name}`);
        break;
      }

      console.log(`\n AI requested tool: ${name}`);
      const fn = toolFunctions[name as keyof typeof toolFunctions];
      const toolResult = await fn(args as any);

      let responsePayload: any = toolResult;

      if (name === "exeSQL") {
        if ("result" in toolResult) {
          lastSQLResult = toolResult.result ?? [];
        } else {
          lastSQLResult = [];
        }

        responsePayload = {
          status: "executed",
          rowCount: Array.isArray(lastSQLResult)
            ? lastSQLResult.length
            : 0,
          hasResult: true,
        };

        console.log(`[AI] Stored ${responsePayload.rowCount} rows for displaySQL.`);
      }

      if (name === "displaySQL") {
        if (lastSQLResult && lastSQLResult.length > 0) {
          displayResult(lastSQLResult);
        } else {
          console.warn("[AI] No previous SQL results found to display.");
        }
      }

      contents.push({ role: "model", parts: [{ functionCall: call }] });
      contents.push({
        role: "user",
        parts: [{ functionResponse: { name, response: responsePayload } }],
      });

      continue;
    }

    const text = candidate?.content?.parts?.[0]?.text ?? "No final response.";
    console.log("\n Final AI message:\n", text);
    return text;
  }
}
