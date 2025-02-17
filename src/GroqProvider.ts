import Groq from "groq-sdk";


class GroqProvider implements AIProvider {
    private groq: any; // Replace with actual Groq client type
  
    constructor(apiKey: string) {
        this.groq = new Groq({ apiKey });
    }
  
    async chatCompletion(params: {
        model: string;
        messages: any[];
        tools?: any[];
        max_tokens?: number;
        temperature?: number;
    }): Promise<any> {
        return this.groq.chat.completions.create({
            model: params.model,
            messages: params.messages,
            tools: params.tools,
            max_tokens: params.max_tokens,
            temperature: params.temperature
        });
    }

  }

  export default GroqProvider;
