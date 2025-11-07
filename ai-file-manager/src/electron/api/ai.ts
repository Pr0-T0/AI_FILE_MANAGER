import "dotenv/config";
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

// Initialize Gemini
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY as string, // Ensure your key is set in .env
});

// Define the structure of the SQL function call
interface GenerateSQLArgs {
  sql: string;
}

// Define your function declaration for SQL generation
const generateSQLFunctionDeclaration = {
  name: "generate_sql",
  description:
    "Generate a valid SQL query for a file metadata database based on a natural language request.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      sql: {
        type: Type.STRING,
        description: "A valid SQL SELECT query for the files table.",
      },
    },
    required: ["sql"],
  },
};

// Example schema context to help Gemini understand your DB
const schemaContext = `
The database table is named 'files' and has these columns:
- path (TEXT)
- name (TEXT)
- parent (TEXT)
- type (TEXT: "file" or "folder")
- extension (TEXT)
- size (INTEGER)
- created_at (INTEGER: UNIX timestamp)
- modified_at (INTEGER: UNIX timestamp)
`;

/**
 * Generate a SQL query from a natural language prompt using Gemini
 */
export async function generateSQLQuery(
  userQuery: string
): Promise<string | null> {
  try {
    const userPrompt = `
${schemaContext}

User request: ${userQuery}
`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        temperature: 0,
        tools: [
          {
            functionDeclarations: [generateSQLFunctionDeclaration],
          },
        ],
      },
    });

    // Check for function calls in the response
    if (response.functionCalls && response.functionCalls.length > 0) {
      const functionCall = response.functionCalls[0];
      const args = functionCall.args as GenerateSQLArgs;

      console.log(`Function called: ${functionCall.name}`);
      console.log(`Generated SQL: ${args.sql}`);

      return args.sql;
    } else {
      console.warn("No function call found. Model might have responded in text.");
      console.log("Raw response:", response.text);
      return null;
    }
  } catch (err) {
    console.error("Error generating SQL:", err);
    return null;
  }
}

// Example usage (you can remove this block if importing elsewhere)
if (import.meta.main) {
  const sql = await generateSQLQuery("Show me the last trip pictures");
  console.log("Final SQL:", sql);
}
