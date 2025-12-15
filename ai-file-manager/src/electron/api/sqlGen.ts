import { ChatOllama } from "@langchain/ollama";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";

/**
 * sqlGen
 * ----------
 * Stateless SQL generator.
 * Input  : Natural language request
 * Output : A single valid SQLite SELECT query (string)
 */
export async function sqlGen(request: string): Promise<string> {
  const model = new ChatOllama({
    model: "llama3.1:8b",   // or "qwen2.5:7b" (better for SQL)
    temperature: 0,
  });

  const systemPrompt = `
You are an expert SQL generator.

Task:
- Convert the user's request into a valid SQLite SELECT query.

Database schema:

Table: files_index
Columns:
- path TEXT
- name TEXT
- parent TEXT
- type TEXT        -- 'file' or 'directory' only
- extension TEXT  -- always starts with a dot (e.g. '.pdf')
- size INTEGER
- created_at INTEGER
- modified_at INTEGER

STRICT RULES (MANDATORY):
1. Output ONLY the SQL query.
2. Output exactly ONE SQLite SELECT statement.
3. DO NOT include explanations, markdown, or backticks.
4. NEVER output INSERT, UPDATE, DELETE, DROP, or PRAGMA.
5. The parent column contains the NAME of the parent folder.
6. type can only be 'file' or 'directory'.
7. If the request is ambiguous, make the safest reasonable assumption.
  `.trim();

  const response = await model.invoke([
    new SystemMessage(systemPrompt),
    new HumanMessage(request),
  ]);

  const sql = response.content.toString().trim();

  return sql;
}
