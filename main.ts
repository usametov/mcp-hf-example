import { HfInference } from '@huggingface/inference'
import { StdioServerParameters } from "@modelcontextprotocol/sdk/client/stdio.js";
import { MCPClient } from "./MCPClient";

// Add type declaration for Deno
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  exit(code: number): never;
};

const accessToken = Deno.env.get('HUGGINGFACE_ACCESS_TOKEN');
if (!accessToken) {
  console.error('HUGGINGFACE_ACCESS_TOKEN environment variable is not set');
  Deno.exit(1);
}

const hf = new HfInference(accessToken);
const MODEL_ID = "meta-llama/Llama-3.3-70B-Instruct";
// System prompt that guides the LLM's behavior and capabilities
// This helps the model understand its role and available tools
const SYSTEM_PROMPT = `You are a helpful assistant capable of accessing external functions and engaging in casual chat. Use the responses from these function calls to provide accurate and informative answers. The answers should be natural and hide the fact that you are using tools to access real-time information. Guide the user about available tools and their capabilities. Always utilize tools to access real-time information when required. Engage in a friendly manner to enhance the chat experience.

# Tools

{tools}

# Notes

- Ensure responses are based on the latest information available from function calls.
- Maintain an engaging, supportive, and friendly tone throughout the dialogue.
- Always highlight the potential of available tools to assist users comprehensively.`;

async function agentLoop(
  query: string,
  tools: Record<string, any>,
  messages: any[] = []
): Promise<[string, any[]]> {
  // Initialize system prompt if no messages provided
  if (messages.length === 0) {
      const toolDescriptions = Object.values(tools)
          .map(t => `${t.name}: ${t.schema.function.description}`)
          .join("\n- ");
      
      messages.push({
          role: "system",
          content: SYSTEM_PROMPT.replace("{tools}", toolDescriptions)
      });
  }

  // Add user query
  messages.push({ role: "user", content: query });

  // Query LLM (replace with actual LLM client implementation)
  const firstResponse = await hf.chatCompletion({
      model: MODEL_ID,
      messages,
      tools: Object.values(tools).map(t => t.schema),
      max_tokens: 4096,
      temperature: 0
  });

  const stopReason = firstResponse.choices[0].finish_reason;

  if (stopReason === "tool_calls") {

      const tool_calls = firstResponse?.choices[0]?.message?.tool_calls || [];
      // Process tool calls
      for (const toolCall of tool_calls) {
          const args = typeof toolCall.function.arguments === "string" ?
              JSON.parse(toolCall.function.arguments) :
              toolCall.function.arguments;

          const toolResult = await tools[toolCall.function.name].callable(args);
          
          messages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              name: toolCall.function.name,
              content: JSON.stringify(toolResult)
          });
      }

      // Get final response
      const newResponse = await hf.chatCompletion({
          model: MODEL_ID,
          messages
      });

      messages.push({
          role: "assistant",
          content: newResponse.choices[0].message.content
      });

      return [newResponse.choices[0]?.message?.content || "", messages];
  } else if (stopReason === "stop") {
      // Use initial response
      messages.push({
          role: "assistant",
          content: firstResponse.choices[0].message.content
      });

      return [firstResponse?.choices[0]?.message?.content || "", messages];
  } else {
      throw new Error(`Unknown stop reason: ${stopReason}`);
  }
}


async function main() {
  // Configure Docker-based MCP server for SQLite
  const serverParams: StdioServerParameters = {
      command: "docker",
      args: [
          "run",
          "--rm",  // Remove container after exit
          "-i",    // Interactive mode
          "-v",    // Mount volume
          "mcp-test:/mcp",  // Map local volume to container path
          "mcp/sqlite",     // Use SQLite MCP image
          "--db-path",
          "/mcp/test.db"    // Database file path inside container
      ],
      env: undefined
  };

  // Create MCP client
  const mcpClient = new MCPClient(serverParams);
  await mcpClient.connect();

  try {
      // Get available database tools and prepare them for the LLM
      const mcpTools = await mcpClient.getAvailableTools();
      
      // Convert MCP tools into a format the LLM can understand and use
      const tools: Record<string, any> = {};
      for (const tool of mcpTools) {
          if (tool.name !== "list_tables") {  // Exclude list_tables tool
              tools[tool.name] = {
                  name: tool.name,
                  callable: mcpClient.createToolCaller(tool.name),
                  schema: {
                      type: "function",
                      function: {
                          name: tool.name,
                          description: tool.description,
                          parameters: tool.inputSchema
                      }
                  }
              };
          }
      }

      // Start interactive prompt loop for user queries
      let messages: any[] | undefined;
      while (true) {
          try {
              // Get user input and check for exit commands
              const userInput = prompt("\nEnter your prompt (or 'quit' to exit): ");
              if (userInput?.toLowerCase() === "quit" || 
                  userInput?.toLowerCase() === "exit" || 
                  userInput?.toLowerCase() === "q") {
                  break;
              }

              if (!userInput) continue;

              // Process the prompt and run agent loop
              const [response, newMessages] = await agentLoop(userInput, tools, messages);
              console.log("\nResponse:", response);
              messages = newMessages;
          } catch (error) {
              if (error instanceof Error) {
                  console.error("\nError occurred:", error.message);
              } else {
                  console.error("\nUnknown error occurred");
              }
          }
      }
  } finally {
      // Clean up resources
      // await mcpClient.close(); // Implement close method if needed
  }
}

// Run the main function
main().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});

// read about deno module_metadata
// https://docs.deno.com/runtime/manual/examples/module_metadata#concepts

