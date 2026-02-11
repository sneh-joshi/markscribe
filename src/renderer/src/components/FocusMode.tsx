import React, { useState, useEffect, useRef } from 'react'

interface FocusModeProps {
  content: string
  onChange: (value: string) => void
  onExit: () => void
  theme: 'light' | 'dark' | 'system'
}

export const FocusMode: React.FC<FocusModeProps> = ({ content, onChange, onExit, theme }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [readingTime, setReadingTime] = useState(0)

  useEffect(() => {
    // Calculate statistics
    const words = content
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0).length
    const chars = content.length
    const reading = Math.ceil(words / 200) // Average reading speed: 200 words/min

    setWordCount(words)
    setCharCount(chars)
    setReadingTime(reading)
  }, [content])

  useEffect(() => {
    // Focus on textarea when component mounts
    textareaRef.current?.focus()
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Exit focus mode with Esc
    if (e.key === 'Escape') {
      onExit()
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-black flex flex-col">
      {/* Minimal Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <span>{wordCount} words</span>
          <span>·</span>
          <span>{charCount} characters</span>
          <span>·</span>
          <span>{readingTime} min read</span>
        </div>

        <button
          onClick={onExit}
          className="px-4 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          title="Exit Focus Mode (Esc)"
        >
          Exit Focus Mode
        </button>
      </div>

      {/* Centered Textarea */}
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <div className="w-full max-w-4xl h-full flex items-center px-8">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full h-full resize-none bg-transparent text-gray-900 dark:text-gray-100 text-lg leading-relaxed focus:outline-none font-serif"
            style={{
              caretColor: '#3b82f6',
              lineHeight: '1.8'
            }}
            placeholder="Start writing..."
            spellCheck={true}
          />
        </div>
      </div>

      {/* Subtle Footer Hint */}
      <div className="px-6 py-2 text-center text-xs text-gray-400 dark:text-gray-600">
        Press <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">Esc</kbd> to exit
        focus mode
      </div>
    </div>
  )
}
