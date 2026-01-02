import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { tool } from "@langchain/core/tools";
import * as z from "zod";

import { executeSQL } from "../db/exeSQL.js";
import { displayResult } from "../test/displaySQL.js";
import "dotenv/config";
import { createFolder } from "../tools/createFolder.js";


const model = new ChatGoogleGenerativeAI({
  model : "gemini-2.5-flash",
  temperature: 0,
  apiKey: process.env.GEMINI_API_KEY_1,
});




const query_file_index = tool(
  async ({ request }) => {
    console.log("sqlgen_exesql called");

    //generate SQL
    console.log("[AI] request : ",request);
    const sql = await sqlGen(request);
    console.log("[AI] sql : ",sql);

    // execute SQL
    const rows = await executeSQL(sql);

    const result = normalizeSQLResult(rows);

    console.log(result);
    return {  result };
  },
  {
    name: "query_file_index",
    description: "Search the file index using natural language and return factual information about matching files and folders",
    schema: z.object({
      request : z.string().describe("Natural language description of the files or folders to retrieve"),
    }),
  }
);

export const display_result_to_ui = tool(
  async ({ result, message }) => {
    // No side effects here.
    // Just declare the final UI payload.
    return {
      payload: {
        ...result,   // { kind, items | metric/value }
        message,     // brief human-readable explanation
      },
    };
  },
  {
    name: "display_result_to_ui",
    description:
      "Finalize the AI response and make it available to the frontend UI. " +
      "This tool marks the end of reasoning.",
    schema: z.object({
      result: z.object({
        kind: z.enum(["files", "aggregate","conversation"]),
      }).passthrough(),
      message: z
        .string()
        .describe("Short, user-facing explanation of the result"),
    }),
  }
);


// const display_file_results = tool(
//   ({ data }) => {
//     console.log("display_file_results called");

//     const displayStatus = displayResult(data);

//     if (displayStatus === true) {
//       return { status: "shown" };
//     }

//     return {
//       status: "error",
//       error: displayStatus,
//     };
//   },
//   {
//     name: "display_file_results",
//     description:
//       "Display file or folder search results in the user interface. Use only for lists of files or folders.",
//     schema: z.object({
//       data: z
//         .any()
//         .describe(
//           "Structured file or folder data returned from the file index"
//         ),
//     }),
//   }
// );


const createfolder = tool(
  async ( { path } ) => {
    console.log("createFolder called");
    const result = await createFolder(path);
    if ("error" in result) {
      return {
        status : "error : Absolute path required. Use sqlgen_exesql to fetch a file path from the target directory",
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
const moveorcopypath = tool(
  async ({ sourcePath, destinationPath, operation }) => {
    console.log("moveOrCopyPath called");

    const result = await moveorCopyPath(
      sourcePath,
      destinationPath,
      operation
    );

    if ("error" in result) {
      return {
        status:
          "error : Absolute paths required. Do not guess paths. Use sqlgen_exesql to resolve file or directory paths before calling this tool.",
        error: result.error,
      };
    }

    return {
      status: operation === "cut" ? "moved" : "copied",
      path: result.path,
    };
  },
  {
    name: "moveorcopypath",
    description:
      "Copy or move (cut) a file or folder from a resolved absolute source path to a resolved absolute destination path. " +
      "Do not fabricate paths. " +
      "Use sqlgen_exesql to resolve both source and destination paths before calling this tool.",
    schema: z.object({
      sourcePath: z
        .string()
        .describe("Absolute path of the source file or folder"),
      destinationPath: z
        .string()
        .describe(
          "Absolute destination directory or full target path"
        ),
      operation: z
        .enum(["copy", "cut"])
        .describe("Operation type: copy (duplicate) or cut (move)"),
    }),
  }
);



//augment with tools

const toolsByName = {
  [createfolder.name] : createfolder,
  [query_file_index.name] : query_file_index,
  [display_result_to_ui.name] : display_result_to_ui,
  [moveorcopypath.name] : moveorcopypath,
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
        "You are a helpfull file manager assistant named LINC tasked with performing file operations.all file metadata information is stored in a sql db which is nt visible or known to the user.always try to display the final result to the user not only the text responce"

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
// import { clear } from "console";
import { sqlGen } from "./sqlGen.js";
import { moveorCopyPath } from "../tools/moveorCopyPath.js";
import { normalizeSQLResult } from "../tools/normalizeSQLResult.js";

// import { console } from "inspector"; this import ruined two days of development :)
// const result = await agent.invoke({
//   messages: [new HumanMessage("who are you")],
// });


export async function runAgent(userInput: string) {
  let lastQueryResult: any = null; //for storing paths ig


  const result = await agent.invoke({
    messages: [new HumanMessage(userInput)],
  });

  for (const message of result.messages) {
    console.log(`[${message.getType()}]: ${message.text}`);
  }

  //capture file paths and meta information
  for (const msg of result.messages) {
    if (
      msg.getType() === "tool" &&
      msg.name === "query_file_index"
    ){
      lastQueryResult = JSON.parse(msg.text).result;
    }
  }


  //For sending Data to Frontend
  for (const msg of result.messages) {
    if (
      msg.getType() === "tool" &&
      msg.name === "display_result_to_ui"
    ) {
      const parsed = JSON.parse(msg.text);
      return {
        ...(lastQueryResult ?? {}),
        ...parsed.payload,
        items:parsed.payload.items ?? lastQueryResult?.items,
      };
    }
  }

  // coversational fallback
  const lastAI = [...result.messages]
    .reverse()
    .find(m => m.getType() === "ai");
  if (lastAI) {
    return {
      kind: "conversation",
      message: lastAI.text,
    };
  }

  // fallback (important)
  return {
    kind: "aggregate",
    metric: "error",
    value: "No displayable result",
    message: "AI did not produce a UI result.",
  };

 // return result; // full result including messages + tool traces
}


// for (const message of result.messages) {
//   console.log(`[${message.getType()}]: ${message.text}`);
// }