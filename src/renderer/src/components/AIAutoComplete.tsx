import { useEffect, useRef, useState } from 'react'
import { aiProviderManager } from '../lib/ai/provider-manager'
import { buildMarkdownAutoCompletePrompt } from '../lib/ai/prompts/autoComplete'

const CONTEXT_CHARS = 2000
const AFTER_CONTEXT_CHARS = 800
const PRIMARY_MAX_TOKENS = 80
const FALLBACK_MAX_TOKENS = 180
const INLINE_MAX_CHARS = 120

function normalizeForCompare(value: string): string {
  return (value || '').replace(/\s+/g, ' ').trim().toLowerCase()
}

function getLastNonEmptyLine(value: string): string {
  const lines = (value || '').split('\n')
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim()
    if (line) return line
  }
  return ''
}

function isRepetitiveSuggestion(
  candidate: string,
  contextBeforeCursor: string,
  contextAfterCursor: string,
  previousSuggestion: string
): boolean {
  const normalizedCandidate = normalizeForCompare(candidate)
  if (!normalizedCandidate) return true

  const normalizedAfter = normalizeForCompare(contextAfterCursor)
  if (normalizedAfter.startsWith(normalizedCandidate)) return true

  const normalizedBefore = normalizeForCompare(contextBeforeCursor)
  if (normalizedBefore.endsWith(normalizedCandidate)) return true

  const lastLine = normalizeForCompare(getLastNonEmptyLine(contextBeforeCursor))
  if (lastLine && normalizedCandidate === lastLine) return true

  const normalizedPrevious = normalizeForCompare(previousSuggestion)
  if (normalizedPrevious && normalizedCandidate === normalizedPrevious) return true

  return false
}

function trimOverlapWithRightContext(rawSuggestion: string, rightContext: string): string {
  let suggestion = (rawSuggestion || '').trim()
  const right = (rightContext || '').trimStart()
  if (!suggestion || !right) return suggestion

  const rightFirstLine = right.split('\n').find((line) => line.trim().length > 0)?.trim() ?? ''
  if (rightFirstLine) {
    const index = suggestion.indexOf(rightFirstLine)
    if (index > 0) {
      suggestion = suggestion.slice(0, index).trimEnd()
    }
  }

  // Trim suffix overlap with the right context prefix.
  const maxOverlap = Math.min(suggestion.length, right.length, 240)
  for (let overlap = maxOverlap; overlap >= 8; overlap--) {
    const leftSuffix = suggestion.slice(-overlap)
    const rightPrefix = right.slice(0, overlap)
    if (leftSuffix === rightPrefix) {
      suggestion = suggestion.slice(0, -overlap).trimEnd()
      break
    }
  }

  return suggestion
}

function sanitizeInlineSuggestion(rawSuggestion: string): string {
  const normalized = (rawSuggestion || '').replace(/\r\n/g, '\n')
  const firstLine = normalized.split('\n')[0]?.trim() ?? ''
  if (!firstLine) return ''

  let inline = firstLine.replace(/\s+/g, ' ').trim()
  if (!inline) return ''

  if (inline.length > INLINE_MAX_CHARS) {
    const clipped = inline.slice(0, INLINE_MAX_CHARS)
    const lastSpace = clipped.lastIndexOf(' ')
    inline = (lastSpace > 24 ? clipped.slice(0, lastSpace) : clipped).trimEnd()
  }

  return inline
}

interface UseAIAutoCompleteParams {
  content: string
  cursorPosition: number
  enabled: boolean
  refreshToken?: number
}

interface UseAIAutoCompleteResult {
  suggestion: string
  loading: boolean
  clearSuggestion: () => void
  consumeSuggestionPrefix: (consumedText: string) => void
}

export function useAIAutoComplete({
  content,
  cursorPosition,
  enabled,
  refreshToken
}: UseAIAutoCompleteParams): UseAIAutoCompleteResult {
  const [suggestion, setSuggestion] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const requestIdRef = useRef(0)
  const previousSuggestionRef = useRef('')

  const clearSuggestion = (): void => setSuggestion('')

  const consumeSuggestionPrefix = (consumedText: string): void => {
    const normalizedConsumed = consumedText || ''
    if (!normalizedConsumed) return

    setSuggestion((current) => {
      if (!current) return ''
      if (!current.startsWith(normalizedConsumed)) return ''
      const remaining = current.slice(normalizedConsumed.length).trimStart()
      previousSuggestionRef.current = remaining
      return remaining
    })
  }

  useEffect(() => {
    if (!enabled) {
      setSuggestion('')
      return
    }

    if (!aiProviderManager.isConfigured()) {
      setSuggestion('')
      return
    }

    // Avoid noisy calls on very small docs.
    if (!content || content.length < 10) {
      setSuggestion('')
      return
    }

    // VS Code-like behavior: avoid inline suggestions in the middle of text.
    // Suggest mostly at line end / before newline, not before non-whitespace content.
    const immediateRightChar = content[cursorPosition] ?? ''
    if (immediateRightChar && immediateRightChar !== '\n') {
      setSuggestion('')
      return
    }

    // Cursor/context changed: clear stale ghost text immediately.
    setSuggestion('')

    const thisRequestId = ++requestIdRef.current

    const timer = setTimeout(async () => {
      const contextBeforeCursor = content.slice(
        Math.max(0, cursorPosition - CONTEXT_CHARS),
        cursorPosition
      )
      const contextAfterCursor = content.slice(
        cursorPosition,
        Math.min(content.length, cursorPosition + AFTER_CONTEXT_CHARS)
      )

      setLoading(true)
      try {
        const provider = aiProviderManager.getProvider()

        const response = await provider.complete({
          prompt: buildMarkdownAutoCompletePrompt({
            contextBeforeCursor,
            contextAfterCursor
          }),
          maxTokens: PRIMARY_MAX_TOKENS,
          temperature: 0.45,
          stream: false
        })

        let nextSuggestion = sanitizeInlineSuggestion(
          trimOverlapWithRightContext(response.text ?? '', contextAfterCursor)
        )
        let isRepetitive = isRepetitiveSuggestion(
          nextSuggestion,
          contextBeforeCursor,
          contextAfterCursor,
          previousSuggestionRef.current
        )

        // Some models (especially reasoning-focused ones) may return empty text
        // for strict insertion prompts. Retry with a simpler prompt.
        if (!nextSuggestion || isRepetitive) {
          const retry = await provider.complete({
            prompt: `Continue this markdown text naturally in 1-2 lines.\n\nCritical rules:\n- Do not repeat the same phrase already at the cursor.\n- Do not repeat the last line from before the cursor.\n- Do not output text that duplicates the beginning of after-cursor text.\n\nBefore cursor:\n${contextBeforeCursor}\n\nAfter cursor:\n${contextAfterCursor}\n\nInsertion:`,
            maxTokens: FALLBACK_MAX_TOKENS,
            temperature: 0.55,
            stream: false
          })
          nextSuggestion = sanitizeInlineSuggestion(
            trimOverlapWithRightContext(retry.text ?? '', contextAfterCursor)
          )
          isRepetitive = isRepetitiveSuggestion(
            nextSuggestion,
            contextBeforeCursor,
            contextAfterCursor,
            previousSuggestionRef.current
          )
        }

        if (requestIdRef.current === thisRequestId) {
          const finalSuggestion = isRepetitive ? '' : nextSuggestion
          previousSuggestionRef.current = finalSuggestion
          setSuggestion(finalSuggestion)
        }
      } catch {
        if (requestIdRef.current === thisRequestId) {
          setSuggestion('')
        }
      } finally {
        if (requestIdRef.current === thisRequestId) {
          setLoading(false)
        }
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [content, cursorPosition, enabled, refreshToken])

  return { suggestion, loading, clearSuggestion, consumeSuggestionPrefix }
}
