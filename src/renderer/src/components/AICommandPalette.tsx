import React, { useMemo, useState } from 'react'
import { aiProviderManager } from '../lib/ai/provider-manager'

export const AI_COMMANDS = [
  {
    id: 'improve',
    label: 'Improve Writing',
    icon: '✨',
    prompt: (text: string) =>
      `Improve the following text while maintaining its meaning:\n\n${text}\n\nImproved version:`
  },
  {
    id: 'summarize',
    label: 'Summarize',
    icon: '📝',
    prompt: (text: string) => `Summarize the following text concisely:\n\n${text}\n\nSummary:`
  },
  {
    id: 'expand',
    label: 'Expand Section',
    icon: '📖',
    prompt: (text: string) =>
      `Expand on the following text with more details:\n\n${text}\n\nExpanded version:`
  },
  {
    id: 'fix-grammar',
    label: 'Fix Grammar',
    icon: '✏️',
    prompt: (text: string) =>
      `Fix grammar and spelling in the following text:\n\n${text}\n\nCorrected version:`
  }
] as const

type AICommandId = (typeof AI_COMMANDS)[number]['id']

interface AICommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  targetText: string
  applyLabel: string
  onApply: (replacement: string) => void
}

export function AICommandPalette({
  isOpen,
  onClose,
  targetText,
  applyLabel,
  onApply
}: AICommandPaletteProps): React.ReactElement | null {
  const [activeCommandId, setActiveCommandId] = useState<AICommandId>('improve')
  const [output, setOutput] = useState('')
  const [running, setRunning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeCommand = useMemo(
    () => AI_COMMANDS.find((c) => c.id === activeCommandId) ?? AI_COMMANDS[0],
    [activeCommandId]
  )

  const canRun = targetText.trim().length > 0

  const handleRun = async (): Promise<void> => {
    setError(null)
    setOutput('')

    if (!aiProviderManager.isConfigured()) {
      setError('AI is not configured. Open AI Settings and enable a provider first.')
      return
    }

    if (!canRun) {
      setError('Nothing to process. Select some text, or add content to the document.')
      return
    }

    setRunning(true)

    try {
      const provider = aiProviderManager.getProvider()
      const prompt = activeCommand.prompt(targetText)

      // Prefer streaming if available.
      let streamed = ''
      for await (const chunk of provider.streamComplete({
        prompt,
        maxTokens: 500,
        temperature: 0.7,
        stream: true
      })) {
        streamed += chunk
        setOutput(streamed)
      }

      // Fallback: if provider didn't stream anything, do a normal completion.
      if (!streamed.trim()) {
        const completion = await provider.complete({
          prompt,
          maxTokens: 500,
          temperature: 0.7,
          stream: false
        })
        setOutput((completion.text ?? '').trim())
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI request failed')
    } finally {
      setRunning(false)
    }
  }

  const handleClose = (): void => {
    if (!running) {
      setError(null)
      setOutput('')
      onClose()
    }
  }

  const handleApply = (): void => {
    if (!output.trim()) return
    onApply(output.trim())
    handleClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">AI Commands</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Run a command on {applyLabel.toLowerCase()}.
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={running}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
            title="Close"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Command
            </label>
            <div className="grid grid-cols-2 gap-2">
              {AI_COMMANDS.map((cmd) => (
                <button
                  key={cmd.id}
                  onClick={() => setActiveCommandId(cmd.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm ${
                    activeCommandId === cmd.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span className="text-base">{cmd.icon}</span>
                  <span className="font-medium">{cmd.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleRun}
              disabled={running}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {running ? 'Running…' : 'Run'}
            </button>
            <button
              onClick={handleApply}
              disabled={running || !output.trim()}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {applyLabel}
            </button>
            <button
              onClick={handleClose}
              disabled={running}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              Output
            </label>
            <textarea
              value={output}
              readOnly
              placeholder="Run a command to see output here…"
              className="w-full min-h-48 p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-mono"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
