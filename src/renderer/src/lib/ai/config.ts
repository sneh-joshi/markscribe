const STORAGE_KEY = 'ai_provider_config'
const OPENAI_TRUSTED_ENDPOINT = 'https://api.openai.com'

let sessionApiKey: string | undefined

export interface StoredAIConfig {
  name: string
  type: 'ollama' | 'openai' | 'anthropic' | 'custom'
  endpoint: string
  apiKey?: string
  model: string
  enabled: boolean
}

export function saveAIConfig(config: StoredAIConfig): void {
  // Keep API key only in-memory for the current app session.
  sessionApiKey = config.apiKey?.trim() || undefined

  const safeConfig: StoredAIConfig = {
    ...config,
    // Prevent endpoint tampering for OpenAI credentials.
    endpoint: config.type === 'openai' ? OPENAI_TRUSTED_ENDPOINT : config.endpoint,
    // Never persist API keys in localStorage.
    apiKey: undefined
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(safeConfig))
}

export function loadAIConfig(): StoredAIConfig | null {
  const data = localStorage.getItem(STORAGE_KEY)
  if (!data) return null

  try {
    const parsed = JSON.parse(data) as StoredAIConfig
    return {
      ...parsed,
      endpoint: parsed.type === 'openai' ? OPENAI_TRUSTED_ENDPOINT : parsed.endpoint,
      apiKey: sessionApiKey
    }
  } catch {
    return null
  }
}

export function clearAIConfig(): void {
  sessionApiKey = undefined
  localStorage.removeItem(STORAGE_KEY)
}

// Default configurations for quick setup
export const DEFAULT_CONFIGS: Record<string, Partial<StoredAIConfig>> = {
  ollama: {
    type: 'ollama',
    endpoint: 'http://localhost:11434',
    model: 'llama3.2',
    enabled: false
  },
  openai: {
    type: 'openai',
    endpoint: 'https://api.openai.com',
    model: 'gpt-4o-mini',
    enabled: false
  }
}
