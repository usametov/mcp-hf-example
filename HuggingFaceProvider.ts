import { HfInference } from '@huggingface/inference';

export class HuggingFaceProvider implements AIProvider {
  private hf: HfInference;

  constructor(accessToken: string) {
    this.hf = new HfInference(accessToken);
  }

  async chatCompletion(params: {
    model: string;
    messages: any[];
    tools?: any[];
    max_tokens?: number;
    temperature?: number;
  }): Promise<any> {
    return this.hf.chatCompletion({
      model: params.model,
      messages: params.messages,
      tools: params.tools,
      max_tokens: params.max_tokens,
      temperature: params.temperature
    });
  }
}