import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { executeSQL } from "../db/exeSQL.js";
import { displayResult } from "../test/displaySQL.js";
import "dotenv/config";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// -------------------- Local Test + Real Functions --------------------

// sqlgen (dummy — local mock for testing)
function sqlgen({ query }: { query: string }) {
  console.log(`Tool Call: sqlgen(query="${query}")`);

  let sql: string;

  if (query.toLowerCase().includes("recent")) {
    sql = "SELECT * FROM files_index ORDER BY modified_at DESC LIMIT 1;";
  } else if (query.toLowerCase().includes("pdf")) {
    sql = "SELECT * FROM files_index WHERE extension = '.pdf';";
  } else if (query.toLowerCase().includes("large")) {
    sql = "SELECT * FROM files_index WHERE size > 10485760;";
  } else {
    sql = "SELECT * FROM files_index LIMIT 10;";
  }

  console.log(`Tool Response (SQL): ${sql}`);
  return { sql };
}

// exeSQL (real DB execution)
function exeSQL({ sql }: { sql: string }) {
  console.log(`Tool Call: exeSQL(sql="${sql}")`);
  const result = executeSQL(sql);
  console.log(`Tool Response (result): ${JSON.stringify(result, null, 2)}`);
  return { result };
}

// displaySQL (real terminal output)
function displaySQL({ result }: { result: any }) {
  console.log("Tool Call: displaySQL(result)");
  displayResult(result);
  console.log("Tool Response: { status: 'shown' }");
  return { status: "shown" };
}

// Map tool names to functions
const toolFunctions = { sqlgen, exeSQL, displaySQL } as const;

// -------------------- Tool Declarations --------------------

const functionDeclarations: FunctionDeclaration[] = [
  {
    name: "sqlgen",
    description:
      "Generates an SQL query string from a natural-language user query about files_index.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: { type: Type.STRING },
      },
      required: ["query"],
    },
  },
  {
    name: "exeSQL",
    description: "Executes an SQL query on the local database.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        sql: { type: Type.STRING },
      },
      required: ["sql"],
    },
  },
  {
    name: "displaySQL",
    description: "Displays SQL execution results and provides a summary.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        result: { type: Type.OBJECT },
      },
      required: ["result"],
    },
  },
];

// -------------------- Compositional Orchestration --------------------

type ChatMessage = {
  role: "user" | "model" | "assistant";
  parts: any[];
};

/**
 * AI orchestration loop:
 * - Receives user query
 * - Chains sqlgen → exeSQL → displaySQL
 * - Returns final natural-language response
 */
export async function runCompositionalChain(userQuery: string) {
  console.log(`\nReceived user query: "${userQuery}"`);

  // Context prompt: instruct Gemini how to use your functions
  const contents: ChatMessage[] = [
    {
      role: "user",
      parts: [
        {
          text: `
You are an AI File Manager Controller.
Your task is to interpret file-related natural language requests and use the available tools below to complete them:

1. sqlgen(query: string) → converts user query into SQL.
2. exeSQL(sql: string) → executes SQL on the local file database.
3. displaySQL(result: object) → displays the final results.

Rules:
- Always start with sqlgen when the user gives a natural-language request.
- Then call exeSQL with the generated SQL.
- Then call displaySQL with the result.
- Never say "I cannot" or refuse file-related queries.
- After tool execution, provide a brief summary (e.g., "Here are your most recent files_index").
- Do not attempt to reason about SQL syntax yourself — always use sqlgen for that.

Begin reasoning now with the user query below.
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

    // --- AI calls a function ---
    if (part && "functionCall" in part && part.functionCall) {
      const call = part.functionCall;
      const { name, args } = call;

      if (!name || !(name in toolFunctions)) {
        console.error(`[AI] Unknown function call: ${name}`);
        break;
      }

      console.log(`\n🧩 AI requested tool: ${name}`);
      const fn = toolFunctions[name as keyof typeof toolFunctions];
      const toolResult = fn(args as any);

      // Add feedback for next reasoning cycle
      contents.push({ role: "model", parts: [{ functionCall: call }] });
      contents.push({
        role: "user",
        parts: [{ functionResponse: { name, response: toolResult } }],
      });

      continue; // Continue reasoning
    }

    // --- AI produces final message ---
    const text = candidate?.content?.parts?.[0]?.text ?? "No final response.";
    console.log("\n Final AI message:\n", text);
    return text;
  }
}
