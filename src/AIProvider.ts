interface AIProvider {
    chatCompletion(params: {
      model: string;
      messages: any[];
      tools?: any[];
      max_tokens?: number;
      temperature?: number;
    }): Promise<any>;
  }