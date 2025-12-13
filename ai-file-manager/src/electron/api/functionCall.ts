import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { tool } from "@langchain/core/tools";
import * as z from "zod";

import { executeSQL } from "../db/exeSQL.js";
import { displayResult } from "../test/displaySQL.js";
import "dotenv/config";
import { createSQLChatSession } from "./sqlGen.js";


const model = new ChatGoogleGenerativeAI({
  model : "gemini-2.5-flash",
  temperature: 0,
  apiKey: process.env.GEMINI_API_KEY_1,
});


/* ===================== TOOL IMPLEMENTATIONS ===================== */

// -------- sqlgen (uses chat session internally) --------

let sqlChat: Awaited<ReturnType<typeof createSQLChatSession>> | null = null;


const sqlgen_exesql = tool(
  async ({ query }) => {
    console.log("sqlgen_exesql called");

    // create chat if not exist
    if (!sqlChat) {
      sqlChat = await createSQLChatSession();
      console.log("Initialized chat session");
    }

    // generate SQL
    const response = await sqlChat.sendMessage({ message: query });
    const sql = response.text?.trim() ?? "";

    console.log("Generated SQL:", sql);

    // execute SQL
    const result = await executeSQL(sql);

    return { sql, result };
  },
  {
    name: "sqlgen_exesql",
    description: "Generate SQL from natural language and execute it in one step",
    schema: z.object({
      query: z.string().describe("Natural language query to convert into SQL and execute"),
    }),
  }
);


const displasql = tool(
  ({ result }) => {
    console.log("displaySQL called");
    const displayStatus = displayResult(result);
    if(displayStatus === true)
      return {status : "shown"}
    else {
      return {
        status: "error",
        error: displayStatus,
      };
    }
  },
  {
    name : "displaysql",
    description : "Display tabular file listings in the UI. Do not use for counts or aggregate values",
    schema : z.object({
      result : z.any().describe("Result returned from executing the sql query"),
    }),
  }
);

const createfolder = tool(
  async ( { path } ) => {
    console.log("createFolder called");
    const result = await createFolder(path);
    if ("error" in result) {
      return {
        status : "error",
        error : result.error,
      };
    }
    return {
      status : "created",
      path : result.path,
    };
  }, 
  {
    name : "createfolder",
    description : "Create a new folder at the given absolute path and update the index file database.- The path must already be resolved.- Do not guess or fabricate paths.- Use sqlgen_exesql to resolve directory paths when needed.",
    schema : z.object({
      path : z.string().describe("Absolute path of the folder to create"),
    }),
  }
);

//augment with tools

const toolsByName = {
  [createfolder.name] : createfolder,
  [sqlgen_exesql.name] : sqlgen_exesql,
  [displasql.name] : displasql,
};
const tools = Object.values(toolsByName);
const modelWithTools = model.bindTools(tools);

//define states
import { StateGraph, START, END, MessagesZodMeta } from "@langchain/langgraph";
import { registry } from "@langchain/langgraph/zod";
import { type BaseMessage } from "@langchain/core/messages";

const MessagesState = z.object({
  messages: z
      .array(z.custom<BaseMessage>())
      .register(registry, MessagesZodMeta),
    llmCalls: z.number().optional(),
});

//model node defenition
import { SystemMessage } from "@langchain/core/messages";

async function llmCall(state:z.infer<typeof MessagesState>) {
  return {
    messages:  await modelWithTools.invoke([
      new SystemMessage(
        "You are a helpfull file manager assistant named LINC tasked with performing file operations.all file metadat information is stored in a sql db which is nt visible or known to the user."

      ),
      ...state.messages,
    ]),
    llmCalls: (state.llmCalls ?? 0) + 1,
  };
}

//tool node def

import { isAIMessage, ToolMessage } from "@langchain/core/messages";

async function toolNode(state:z.infer<typeof MessagesState>) {
  const LastMessage = state.messages.at(-1);

  if (LastMessage == null || !isAIMessage(LastMessage)){
    return { messages: []}
  }

  const result: ToolMessage[] = [];
  for (const toolCall of LastMessage.tool_calls ?? []){
    const tool = toolsByName[toolCall.name];
    const observation = await tool.invoke(toolCall);
    result.push(observation);
  }

  return { messages: result};
}

//end or continue
async function shouldContinue(state: z.infer<typeof MessagesState>) {
  const lastMessage = state.messages.at(-1);
  if (lastMessage == null || !isAIMessage(lastMessage)) return END;

  // If the LLM makes a tool call, then perform an action
  if (lastMessage.tool_calls?.length) {
    return "toolNode";
  }

  // Otherwise, we stop (reply to the user)
  return END;
}

// Step 6: Build and compile the agent

const agent = new StateGraph(MessagesState)
  .addNode("llmCall", llmCall)
  .addNode("toolNode", toolNode)
  .addEdge(START, "llmCall")
  .addConditionalEdges("llmCall", shouldContinue, ["toolNode", END])
  .addEdge("toolNode", "llmCall")
  .compile();

// Invoke
import { HumanMessage } from "@langchain/core/messages";
import { clear } from "console";
import { createFolder } from "../tools/createFolder.js";
// const result = await agent.invoke({
//   messages: [new HumanMessage("who are you")],
// });

export async function runAgent(userInput: string) {
  const result = await agent.invoke({
    messages: [new HumanMessage(userInput)],
  });

  for (const message of result.messages) {
    console.log(`[${message.getType()}]: ${message.text}`);
  }

  return result; // full result including messages + tool traces
}


// for (const message of result.messages) {
//   console.log(`[${message.getType()}]: ${message.text}`);
// }