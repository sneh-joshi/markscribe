import type {
  IAIProviderService,
  AIProvider,
  AICompletionRequest,
  AICompletionResponse
} from '../types'

const OPENAI_TRUSTED_ORIGIN = 'https://api.openai.com'

function getTrustedOpenAIBase(endpoint: string): string {
  let url: URL
  try {
    url = new URL(endpoint || OPENAI_TRUSTED_ORIGIN)
  } catch {
    throw new Error('Invalid OpenAI endpoint URL')
  }

  if (url.protocol !== 'https:' || url.hostname !== 'api.openai.com') {
    throw new Error('OpenAI endpoint is restricted to https://api.openai.com')
  }

  if (url.username || url.password) {
    throw new Error('OpenAI endpoint must not contain credentials')
  }

  return OPENAI_TRUSTED_ORIGIN
}

export class OpenAIProvider implements IAIProviderService {
  constructor(private config: AIProvider) {}

  private getApiKey(): string {
    const apiKey = this.config.apiKey?.trim()
    if (!apiKey) {
      throw new Error('OpenAI API key is required. Enter it in AI Settings.')
    }
    return apiKey
  }

  private getBaseUrl(): string {
    return getTrustedOpenAIBase(this.config.endpoint)
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/v1/models`, {
        headers: { Authorization: `Bearer ${this.getApiKey()}` }
      })
      return response.ok
    } catch {
      return false
    }
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const response = await fetch(`${this.getBaseUrl()}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.getApiKey()}`
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [{ role: 'user', content: request.prompt }],
        max_tokens: request.maxTokens ?? 500,
        temperature: request.temperature ?? 0.7,
        stream: false
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    return {
      text: data.choices[0].message.content,
      model: data.model,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens
      }
    }
  }

  async *streamComplete(request: AICompletionRequest): AsyncGenerator<string> {
    const response = await fetch(`${this.getBaseUrl()}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.getApiKey()}`
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [{ role: 'user', content: request.prompt }],
        max_tokens: request.maxTokens ?? 500,
        temperature: request.temperature ?? 0.7,
        stream: true
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('Response body is not readable')
    }

    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter((line) => line.startsWith('data: '))

      for (const line of lines) {
        const data = line.replace('data: ', '')
        if (data === '[DONE]') break

        try {
          const json = JSON.parse(data)
          const content = json.choices[0]?.delta?.content
          if (content) yield content
        } catch {
          // Skip invalid JSON
        }
      }
    }
  }

  async listModels(): Promise<string[]> {
    const response = await fetch(`${this.getBaseUrl()}/v1/models`, {
      headers: { Authorization: `Bearer ${this.getApiKey()}` }
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data?.map((m: any) => m.id) ?? []
  }
}
