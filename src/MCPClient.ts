import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport, StdioServerParameters } from "@modelcontextprotocol/sdk/client/stdio.js";

export class MCPClient {
    private serverParams: StdioServerParameters;
    private client?: Client;
    private session?: any; // Replace with actual session type if available

    constructor(serverParams: StdioServerParameters) {
        this.serverParams = serverParams;
    }

    async connect() {
        // Create and connect client
        const transport = new StdioClientTransport(this.serverParams);
        this.client = new Client({
            name: "MCPClient",
            version: "1.0.0"
        });
        await this.client.connect(transport);
        
        // Initialize session (replace with actual session initialization)
        // this.session = await this.client.createSession();
        // await this.session.initialize();
    }

    async getAvailableTools(): Promise<any[]> {
        if (!this.client) {
            throw new Error("Not connected to MCP server");
        }

        const tools = await this.client.listTools();
        return tools.tools;
    }

    createToolCaller(toolName: string): (...args: any[]) => Promise<any> {
        if (!this.client) {
            throw new Error("Not connected to MCP server");
        }

        return async (...args: any[]) => {
            if (!this.client) {
                throw new Error("Client not initialized");
            }
            
            // Create the proper parameter structure expected by callTool
            const params = {
                name: toolName,
                arguments: args.length > 0 ? args[0] : {}
            };
    
            const response = await this.client.callTool(params);
            return response;
        };
    }
}

