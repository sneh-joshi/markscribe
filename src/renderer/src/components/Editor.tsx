import React, { useEffect, useMemo, useRef, useState } from 'react'
import MDEditor from '@uiw/react-md-editor'
import '@uiw/react-md-editor/markdown-editor.css'

interface EditorProps {
  content: string
  onChange: (value: string) => void
  theme?: 'light' | 'dark' | 'system'
  spellCheck?: boolean
  onCursorPositionChange?: (position: number) => void
  onSelectionChange?: (start: number, end: number) => void
  aiSuggestion?: string
  onSuggestionAccepted?: () => void
  onSuggestionPartiallyAccepted?: (acceptedText: string) => void
}

function getNextWordChunk(suggestion: string): string {
  const text = (suggestion || '').trimStart()
  if (!text) return ''
  const match = text.match(/^[^\s]+(?:\s+|$)/)
  return (match?.[0] ?? text).trimEnd() + (match?.[0]?.endsWith(' ') ? ' ' : '')
}

export const Editor: React.FC<EditorProps> = ({
  content,
  onChange,
  theme = 'system',
  spellCheck = true,
  onCursorPositionChange,
  onSelectionChange,
  aiSuggestion,
  onSuggestionAccepted,
  onSuggestionPartiallyAccepted
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  const [caretCoords, setCaretCoords] = useState<{ left: number; top: number; height: number } | null>(
    null
  )

  const contentRef = useRef(content)
  const suggestionRef = useRef(aiSuggestion)
  const onChangeRef = useRef(onChange)
  const onSuggestionAcceptedRef = useRef(onSuggestionAccepted)
  const onSuggestionPartiallyAcceptedRef = useRef(onSuggestionPartiallyAccepted)
  const onCursorPositionChangeRef = useRef(onCursorPositionChange)
  const onSelectionChangeRef = useRef(onSelectionChange)

  useEffect(() => {
    contentRef.current = content
    suggestionRef.current = aiSuggestion
    onChangeRef.current = onChange
    onSuggestionAcceptedRef.current = onSuggestionAccepted
    onSuggestionPartiallyAcceptedRef.current = onSuggestionPartiallyAccepted
    onCursorPositionChangeRef.current = onCursorPositionChange
    onSelectionChangeRef.current = onSelectionChange
  }, [
    content,
    aiSuggestion,
    onChange,
    onSuggestionAccepted,
    onSuggestionPartiallyAccepted,
    onCursorPositionChange,
    onSelectionChange
  ])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const cleanupFns: Array<() => void> = []

    const getCaretCoordinates = (el: HTMLTextAreaElement, position: number) => {
      // Creates a mirror element to measure caret coordinates. This is a common
      // technique for textarea caret positioning.
      const div = document.createElement('div')
      const computed = window.getComputedStyle(el)

      // Mirror key text styles.
      div.style.whiteSpace = 'pre-wrap'
      div.style.wordWrap = 'break-word'
      div.style.position = 'absolute'
      div.style.visibility = 'hidden'
      div.style.pointerEvents = 'none'
      div.style.top = '0'
      div.style.left = '0'

      div.style.fontFamily = computed.fontFamily
      div.style.fontSize = computed.fontSize
      div.style.fontWeight = computed.fontWeight
      div.style.fontStyle = computed.fontStyle
      div.style.letterSpacing = computed.letterSpacing
      div.style.lineHeight = computed.lineHeight

      div.style.paddingTop = computed.paddingTop
      div.style.paddingRight = computed.paddingRight
      div.style.paddingBottom = computed.paddingBottom
      div.style.paddingLeft = computed.paddingLeft

      div.style.borderTopWidth = computed.borderTopWidth
      div.style.borderRightWidth = computed.borderRightWidth
      div.style.borderBottomWidth = computed.borderBottomWidth
      div.style.borderLeftWidth = computed.borderLeftWidth
      div.style.boxSizing = computed.boxSizing

      // Match the textarea width so wrapping is identical.
      div.style.width = `${el.clientWidth}px`

      const before = el.value.slice(0, Math.max(0, position))
      const after = el.value.slice(Math.max(0, position))

      // Preserve trailing newlines/spaces so the caret position is accurate.
      div.textContent = before

      const marker = document.createElement('span')
      marker.textContent = '\u200b'
      div.appendChild(marker)

      // Add remaining content so wrapping matches the real textarea.
      const rest = document.createElement('span')
      rest.textContent = after
      div.appendChild(rest)

      document.body.appendChild(div)

      const left = marker.offsetLeft
      const top = marker.offsetTop
      const height = marker.offsetHeight || parseFloat(computed.lineHeight || '16')

      document.body.removeChild(div)

      return { left, top, height }
    }

    const updateCaretOverlay = (textarea: HTMLTextAreaElement): void => {
      const pos = textarea.selectionEnd ?? 0
      try {
        const coords = getCaretCoordinates(textarea, pos)
        // Adjust for scrolling inside the textarea.
        setCaretCoords({
          left: coords.left - textarea.scrollLeft,
          top: coords.top - textarea.scrollTop,
          height: coords.height
        })
      } catch {
        setCaretCoords(null)
      }
    }

    const notifySelection = (textarea: HTMLTextAreaElement): void => {
      const start = textarea.selectionStart ?? 0
      const end = textarea.selectionEnd ?? start
      onCursorPositionChangeRef.current?.(end)
      onSelectionChangeRef.current?.(start, end)
      updateCaretOverlay(textarea)
    }

    const attachToTextarea = (textarea: HTMLTextAreaElement): void => {
      textareaRef.current = textarea

      const handleKeyDown = (e: KeyboardEvent): void => {
        // Tab accepts AI suggestion (if available) and inserts it at the cursor/selection.
        if (e.key === 'Tab') {
          const suggestion = suggestionRef.current
          if (suggestion && suggestion.trim()) {
            e.preventDefault()
            const start = textarea.selectionStart ?? 0
            const end = textarea.selectionEnd ?? start
            const current = contentRef.current
            const next = current.slice(0, start) + suggestion + current.slice(end)
            onChangeRef.current(next)

            // Restore caret after React updates.
            queueMicrotask(() => {
              try {
                textarea.selectionStart = textarea.selectionEnd = start + suggestion.length
                textarea.focus()
                notifySelection(textarea)
              } catch {
                // Best-effort.
              }
            })

            onSuggestionAcceptedRef.current?.()
            return
          }
        }

        // Cmd/Ctrl + Right Arrow accepts next word from inline suggestion.
        if ((e.metaKey || e.ctrlKey) && e.key === 'ArrowRight') {
          const suggestion = suggestionRef.current
          if (suggestion && suggestion.trim()) {
            const start = textarea.selectionStart ?? 0
            const end = textarea.selectionEnd ?? start
            if (start !== end) return

            const chunk = getNextWordChunk(suggestion)
            if (!chunk) return

            e.preventDefault()
            const current = contentRef.current
            const next = current.slice(0, start) + chunk + current.slice(end)
            onChangeRef.current(next)

            queueMicrotask(() => {
              try {
                textarea.selectionStart = textarea.selectionEnd = start + chunk.length
                textarea.focus()
                notifySelection(textarea)
              } catch {
                // Best-effort.
              }
            })

            onSuggestionPartiallyAcceptedRef.current?.(chunk)
          }
        }
      }

      const handleKeyUp = (): void => notifySelection(textarea)
      const handleMouseUp = (): void => notifySelection(textarea)
      const handleClick = (): void => notifySelection(textarea)
      const handleScroll = (): void => updateCaretOverlay(textarea)

      textarea.addEventListener('keydown', handleKeyDown)
      textarea.addEventListener('keyup', handleKeyUp)
      textarea.addEventListener('mouseup', handleMouseUp)
      textarea.addEventListener('click', handleClick)
      textarea.addEventListener('scroll', handleScroll)

      cleanupFns.push(() => {
        textarea.removeEventListener('keydown', handleKeyDown)
        textarea.removeEventListener('keyup', handleKeyUp)
        textarea.removeEventListener('mouseup', handleMouseUp)
        textarea.removeEventListener('click', handleClick)
        textarea.removeEventListener('scroll', handleScroll)
      })

      // Initial sync for this textarea instance.
      notifySelection(textarea)
    }

    let boundTextarea: HTMLTextAreaElement | null = null

    const tryBind = (): void => {
      const candidate = container.querySelector('textarea') as HTMLTextAreaElement | null
      if (!candidate || candidate === boundTextarea) return

      // Detach existing listeners before rebinding.
      while (cleanupFns.length) {
        const fn = cleanupFns.pop()
        fn?.()
      }

      boundTextarea = candidate
      attachToTextarea(candidate)
    }

    // Bind immediately (if available), then keep watching for remounts.
    tryBind()
    const observer = new MutationObserver(() => tryBind())
    observer.observe(container, { childList: true, subtree: true })

    return () => {
      observer.disconnect()
      while (cleanupFns.length) {
        const fn = cleanupFns.pop()
        fn?.()
      }
    }
  }, [])

  useEffect(() => {
    // When a new suggestion arrives, reposition the overlay at current caret.
    const textarea = textareaRef.current
    if (!textarea) return
    if (!aiSuggestion) return
    try {
      // Best-effort update.
      const computed = window.getComputedStyle(textarea)
      const lineHeight = parseFloat(computed.lineHeight || '16')
      setCaretCoords((prev) => prev ?? { left: 0, top: 0, height: lineHeight })
    } catch {
      // ignore
    }
  }, [aiSuggestion])

  const suggestionPreview = useMemo(() => {
    if (!aiSuggestion) return ''
    return aiSuggestion.split('\n')[0] ?? ''
  }, [aiSuggestion])

  const shouldShowGhost = useMemo((): boolean => {
    const textarea = textareaRef.current
    if (!textarea) return false
    if (document.activeElement !== textarea) return false
    if (!suggestionPreview.trim()) return false
    if (!caretCoords) return false

    const start = textarea.selectionStart ?? 0
    const end = textarea.selectionEnd ?? start
    if (start !== end) return false

    return true
  }, [caretCoords, content, suggestionPreview])

  // Determine the actual color mode
  const getColorMode = () => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return theme
  }

  const colorMode = getColorMode()

  return (
    <div
      ref={containerRef}
      className="h-full w-full flex flex-col relative"
      data-color-mode={colorMode}
    >
      <style>{`
        /* Make toolbar buttons bigger */
        .w-md-editor-toolbar {
          padding: 10px 12px !important;
        }
        .w-md-editor-toolbar button {
          width: 32px !important;
          height: 32px !important;
        }
        .w-md-editor-toolbar svg {
          width: 16px !important;
          height: 16px !important;
        }
      `}</style>
      <MDEditor
        value={content}
        onChange={(val) => onChange(val || '')}
        height="100%"
        visibleDragbar={false}
        preview="edit"
        hideToolbar={false}
        textareaProps={{
          spellCheck: spellCheck
        }}
      />

      {/* VS Code-style inline ghost suggestion */}
      {shouldShowGhost && caretCoords && textareaRef.current && (
        <div
          className="absolute pointer-events-none z-50"
          style={((): React.CSSProperties => {
            const container = containerRef.current
            const textarea = textareaRef.current
            if (!container || !textarea) return {}
            const containerRect = container.getBoundingClientRect()
            const textareaRect = textarea.getBoundingClientRect()

            return {
              left: textareaRect.left - containerRect.left,
              top: textareaRect.top - containerRect.top,
              width: textarea.clientWidth,
              height: textarea.clientHeight,
              overflow: 'hidden'
            }
          })()}
        >
          <span
            className="absolute text-gray-400 dark:text-gray-500 select-none"
            style={{
              left: caretCoords.left,
              top: caretCoords.top,
              lineHeight: `${caretCoords.height}px`,
              whiteSpace: 'pre',
              maxWidth: Math.max(0, textareaRef.current.clientWidth - caretCoords.left - 12),
              overflow: 'hidden',
              textOverflow: 'clip',
              display: 'inline-block'
            }}
          >
            {suggestionPreview}
          </span>
        </div>
      )}
    </div>
  )
}
