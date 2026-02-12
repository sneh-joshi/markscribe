import type {
  IAIProviderService,
  AIProvider,
  AICompletionRequest,
  AICompletionResponse
} from '../types'

export class OllamaProvider implements IAIProviderService {
  constructor(private config: AIProvider) {}

  private hasIPC(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof (window as any).api?.ollamaTags === 'function' &&
      typeof (window as any).api?.ollamaGenerate === 'function'
    )
  }

  async testConnection(): Promise<boolean> {
    try {
      if (this.hasIPC()) {
        await (window as any).api.ollamaTags(this.config.endpoint)
        return true
      }

      const response = await fetch(`${this.config.endpoint}/api/tags`)
      return response.ok
    } catch {
      return false
    }
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    const payload = {
      model: this.config.model,
      prompt: request.prompt,
      stream: false,
      options: {
        temperature: request.temperature ?? 0.7,
        num_predict: request.maxTokens ?? 500
      }
    }

    const data = this.hasIPC()
      ? await (window as any).api.ollamaGenerate(this.config.endpoint, payload)
      : await (async () => {
          const response = await fetch(`${this.config.endpoint}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })

          if (!response.ok) {
            throw new Error(`Ollama API error: ${response.statusText}`)
          }

          return await response.json()
        })()

    return {
      text: data.response,
      model: data.model
    }
  }

  async *streamComplete(request: AICompletionRequest): AsyncGenerator<string> {
    // If running inside Electron with IPC, we aggregate the streamed output in main
    // and yield it as chunks (single chunk) to avoid complex stream IPC.
    if (this.hasIPC()) {
      const payload = {
        model: this.config.model,
        prompt: request.prompt,
        stream: true,
        options: {
          temperature: request.temperature ?? 0.7,
          num_predict: request.maxTokens ?? 500
        }
      }

      const data = await (window as any).api.ollamaGenerate(this.config.endpoint, payload)
      if (data?.response) yield data.response
      return
    }

    const response = await fetch(`${this.config.endpoint}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.config.model,
        prompt: request.prompt,
        stream: true,
        options: {
          temperature: request.temperature ?? 0.7,
          num_predict: request.maxTokens ?? 500
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`)
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
      const lines = chunk.split('\n').filter(Boolean)

      for (const line of lines) {
        try {
          const json = JSON.parse(line)
          if (json.response) {
            yield json.response
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }
  }

  async listModels(): Promise<string[]> {
    const data = this.hasIPC()
      ? await (window as any).api.ollamaTags(this.config.endpoint)
      : await (async () => {
          const response = await fetch(`${this.config.endpoint}/api/tags`)
          if (!response.ok) {
            throw new Error(`Ollama API error: ${response.statusText}`)
          }
          return await response.json()
        })()

    return data.models?.map((m: any) => m.name) ?? []
  }
}
