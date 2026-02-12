import { OllamaProvider } from './providers/ollama'
import { OpenAIProvider } from './providers/openai'
import type { AIProvider, IAIProviderService } from './types'

export class AIProviderManager {
  private provider: IAIProviderService | null = null
  private currentConfig: AIProvider | null = null

  setProvider(config: AIProvider): void {
    this.currentConfig = config

    switch (config.type) {
      case 'ollama':
        this.provider = new OllamaProvider(config)
        break
      case 'openai':
        this.provider = new OpenAIProvider(config)
        break
      case 'anthropic':
        // TODO: Implement Anthropic provider
        throw new Error('Anthropic provider not yet implemented')
      case 'custom':
        // For custom endpoints, try to detect the type or use a generic provider
        throw new Error('Custom provider not yet implemented')
      default:
        throw new Error(`Unsupported provider type: ${config.type}`)
    }
  }

  getProvider(): IAIProviderService {
    if (!this.provider) {
      throw new Error('No AI provider configured. Please configure a provider first.')
    }
    return this.provider
  }

  getCurrentConfig(): AIProvider | null {
    return this.currentConfig
  }

  isConfigured(): boolean {
    return this.provider !== null
  }

  clear(): void {
    this.provider = null
    this.currentConfig = null
  }
}

// Singleton instance
export const aiProviderManager = new AIProviderManager()
