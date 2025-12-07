import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { executeSQL } from "../db/exeSQL.js";
import { displayResult } from "../test/displaySQL.js";
import "dotenv/config";
import { createSQLChatSession } from "./sqlGen.js";

/* ===================== AI CLIENT ===================== */

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY_1,
});

/* ===================== TOOL IMPLEMENTATIONS ===================== */

// -------- sqlgen (uses chat session internally) --------

let sqlChat: Awaited<ReturnType<typeof createSQLChatSession>> | null = null;

async function sqlgen({ query }: { query: string }) {
  console.log(`Tool Call → sqlgen("${query}")`);

  if (!sqlChat) {
    sqlChat = await createSQLChatSession();
    console.log("[sqlgen] SQL chat session created");
  }

  const response = await sqlChat.sendMessage({ message: query });
  const sql = response.text?.trim() ?? "";

  return { sql };
}

// -------- exeSQL --------

function exeSQL({ sql }: { sql: string }) {
  console.log(`Tool Call → exeSQL`);
  const result = executeSQL(sql);
  return { result };
}

// -------- displaySQL --------

function displaySQL({ result }: { result: any }) {
  console.log(`Tool Call → displaySQL`);
  displayResult(result);
  return { status: "shown" };
}

const toolFunctions = { sqlgen, exeSQL, displaySQL } as const;

/* ===================== TOOL DECLARATIONS ===================== */

const functionDeclarations: FunctionDeclaration[] = [
  {
    name: "sqlgen",
    description:
      "Generate an SQL query from a natural language file-system request.",
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
    description:
      "Execute an SQL query on the local file metadata database.",
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
    description:
      "Display SQL query results to the user.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        result: { type: Type.OBJECT },
      },
      required: ["result"],
    },
  },
];

/* ===================== COMPOSITIONAL CONTROLLER ===================== */

type ChatMessage = {
  role: "user" | "model";
  parts: any[];
};

export async function runCompositionalChain(userQuery: string) {
  console.log(`\nUser: ${userQuery}`);

  const contents: ChatMessage[] = [
    {
      role: "user",
      parts: [
        {
          text: `
You are LINC, an AI file manager.

You have tools that can:
• generate SQL from natural language
• execute SQL queries
• display results

Choose tools only when needed.
Decide the order yourself.
Stop when no more tool calls are necessary.
          `.trim(),
        },
      ],
    },
    {
      role: "user",
      parts: [{ text: userQuery }],
    },
  ];

  while (true) {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        tools: [{ functionDeclarations }],
      },
    });

    const candidate = response.candidates?.[0];
    const part = candidate?.content?.parts?.[0];

    /* ✅ MODEL DECIDES TO FINISH */
    if (part?.text) {
      console.log("\nFinal Response:\n", part.text);
      return part.text;
    }

    /* ✅ MODEL DECIDES NEXT TOOL */
    if (part?.functionCall) {
      const { name, args } = part.functionCall;

      console.log(`\nModel chose tool: ${name}`);
      const tool = toolFunctions[name as keyof typeof toolFunctions];

      const toolResult = await tool(args as any);

      contents.push({
        role: "model",
        parts: [{ functionCall: part.functionCall }],
      });

      contents.push({
        role: "user",
        parts: [
          {
            functionResponse: {
              name,
              response: toolResult,
            },
          },
        ],
      });

      continue;
    }

    console.warn("No text or function call returned");
    return "No response from model.";
  }
}
