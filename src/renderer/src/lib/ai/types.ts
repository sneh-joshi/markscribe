export interface AIProvider {
  name: string
  type: 'ollama' | 'openai' | 'anthropic' | 'custom'
  endpoint: string
  apiKey?: string
  model: string
}

export interface AICompletionRequest {
  prompt: string
  maxTokens?: number
  temperature?: number
  stream?: boolean
}

export interface AICompletionResponse {
  text: string
  model: string
  usage?: {
    promptTokens: number
    completionTokens: number
  }
}

export interface IAIProviderService {
  testConnection(): Promise<boolean>
  complete(request: AICompletionRequest): Promise<AICompletionResponse>
  streamComplete(request: AICompletionRequest): AsyncGenerator<string>
  listModels(): Promise<string[]>
}
