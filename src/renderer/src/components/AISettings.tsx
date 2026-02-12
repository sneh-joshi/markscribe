import { useState, useEffect } from 'react'
import { loadAIConfig, saveAIConfig, clearAIConfig, type StoredAIConfig } from '../lib/ai/config'
import { aiProviderManager } from '../lib/ai/provider-manager'

const OPENAI_ENDPOINT = 'https://api.openai.com'

interface AISettingsProps {
    onClose: () => void
}

export function AISettings({ onClose }: AISettingsProps) {
    const [config, setConfig] = useState<StoredAIConfig>({
        name: 'Ollama Local',
        type: 'ollama',
        endpoint: 'http://localhost:11434',
        model: 'llama3.2',
        enabled: false
    })
    const [testing, setTesting] = useState(false)
    const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)
    const [availableModels, setAvailableModels] = useState<string[]>([])
    const [loadingModels, setLoadingModels] = useState(false)

    // Load saved config on mount
    useEffect(() => {
        const saved = loadAIConfig()
        if (saved) {
            setConfig(saved)
            // If enabled, set up the provider
            if (saved.enabled) {
                try {
                    aiProviderManager.setProvider(saved)
                } catch (error) {
                    console.error('Failed to initialize AI provider:', error)
                }
            }
        }
    }, [])

    const handleTestConnection = async () => {
        setTesting(true)
        setTestResult(null)

        try {
            aiProviderManager.setProvider(config)
            const isConnected = await aiProviderManager.getProvider().testConnection()
            setTestResult(isConnected ? 'success' : 'error')

            // If successful, try to load models
            if (isConnected) {
                setLoadingModels(true)
                try {
                    const models = await aiProviderManager.getProvider().listModels()
                    setAvailableModels(models)
                } catch (error) {
                    console.error('Failed to load models:', error)
                } finally {
                    setLoadingModels(false)
                }
            }
        } catch (error) {
            console.error('Connection test failed:', error)
            setTestResult('error')
        } finally {
            setTesting(false)
        }
    }

    const handleSave = () => {
        saveAIConfig(config)
        if (config.enabled) {
            try {
                aiProviderManager.setProvider(config)
            } catch (error) {
                console.error('Failed to set AI provider:', error)
            }
        } else {
            aiProviderManager.clear()
        }
        onClose()
    }

    const handleClear = () => {
        if (confirm('Clear AI configuration?')) {
            clearAIConfig()
            aiProviderManager.clear()
            setConfig({
                name: 'Ollama Local',
                type: 'ollama',
                endpoint: 'http://localhost:11434',
                model: 'llama3.2',
                enabled: false
            })
            setTestResult(null)
            setAvailableModels([])
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Assistant Settings</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Enable AI */}
                    <div className="flex items-center justify-between">
                        <div>
                            <label className="text-sm font-medium text-gray-900 dark:text-white">
                                Enable AI Assistant
                            </label>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Turn on AI-powered writing features
                            </p>
                        </div>
                        <button
                            onClick={() => setConfig({ ...config, enabled: !config.enabled })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.enabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-700'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${config.enabled ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    {/* Provider Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                            AI Provider
                        </label>
                        <select
                            value={config.type}
                            onChange={(e) =>
                                setConfig({
                                    ...config,
                                    type: e.target.value as StoredAIConfig['type'],
                                    endpoint:
                                        e.target.value === 'ollama'
                                            ? 'http://localhost:11434'
                                            : e.target.value === 'openai'
                                                ? OPENAI_ENDPOINT
                                                : config.endpoint
                                })
                            }
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                            <option value="ollama">Ollama (Local & Private)</option>
                            <option value="openai">OpenAI</option>
                            <option value="anthropic">Anthropic (Coming Soon)</option>
                        </select>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {config.type === 'ollama' && '✓ Free, private, runs locally'}
                            {config.type === 'openai' && '⚡ Fast, requires API key'}
                            {config.type === 'anthropic' && '🚧 Not yet implemented'}
                        </p>
                    </div>

                    {/* Endpoint */}
                    <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                            Endpoint
                        </label>
                        <input
                            type="text"
                            value={config.type === 'openai' ? OPENAI_ENDPOINT : config.endpoint}
                            onChange={(e) => setConfig({ ...config, endpoint: e.target.value })}
                            disabled={config.type === 'openai'}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            placeholder="http://localhost:11434"
                        />
                        {config.type === 'openai' && (
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                OpenAI endpoint is locked to {OPENAI_ENDPOINT} for security.
                            </p>
                        )}
                    </div>

                    {/* API Key (if not Ollama) */}
                    {config.type !== 'ollama' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                                API Key
                            </label>
                            <input
                                type="password"
                                value={config.apiKey || ''}
                                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                placeholder="sk-..."
                            />
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                Your API key is kept in memory for this session only and is not persisted to localStorage
                            </p>
                        </div>
                    )}

                    {/* Model */}
                    <div>
                        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                            Model
                        </label>
                        {availableModels.length > 0 ? (
                            <select
                                value={config.model}
                                onChange={(e) => setConfig({ ...config, model: e.target.value })}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                            >
                                {availableModels.map((model) => (
                                    <option key={model} value={model}>
                                        {model}
                                    </option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type="text"
                                value={config.model}
                                onChange={(e) => setConfig({ ...config, model: e.target.value })}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                placeholder="llama3.2"
                            />
                        )}
                        {loadingModels && (
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Loading models...</p>
                        )}
                    </div>

                    {/* Test Connection */}
                    <div className="flex gap-3">
                        <button
                            onClick={handleTestConnection}
                            disabled={testing || config.type === 'anthropic'}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {testing ? 'Testing...' : 'Test Connection'}
                        </button>
                        {testResult && (
                            <div
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${testResult === 'success'
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                    }`}
                            >
                                {testResult === 'success' ? '✅ Connected!' : '❌ Connection failed'}
                            </div>
                        )}
                    </div>

                    {/* Ollama Installation Help */}
                    {config.type === 'ollama' && testResult === 'error' && (
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <p className="text-sm text-yellow-800 dark:text-yellow-300 font-medium mb-2">
                                Ollama not running?
                            </p>
                            <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-2">
                                Make sure Ollama is installed and running:
                            </p>
                            <code className="block text-xs bg-yellow-100 dark:bg-yellow-900/40 p-2 rounded text-yellow-900 dark:text-yellow-200">
                                # Install Ollama
                                <br />
                                brew install ollama
                                <br />
                                <br />
                                # Start Ollama
                                <br />
                                ollama serve
                                <br />
                                <br />
                                # Pull a model
                                <br />
                                ollama pull llama3.2
                            </code>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={handleClear}
                        className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                        Clear Configuration
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
