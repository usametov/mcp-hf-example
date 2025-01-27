import Groq from "groq-sdk";

/*
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function main() {
  const chatCompletion = await getGroqChatCompletion();
  // Print the completion returned by the LLM.
  console.log(chatCompletion.choices[0]?.message?.content || "");
}

export async function getGroqChatCompletion() {
  return groq.chat.completions.create({
    messages: [
      {
        role: "user",
        content: "Explain the importance of fast language models",
      },
    ],
    model: "llama-3.3-70b-versatile",
  });
}

*/


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