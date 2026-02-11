import React from 'react'
import { Preview } from './Preview'
import { ThemeToggle } from './ThemeToggle'

interface PreviewViewProps {
  content: string
  filePath: string
  onEdit: () => void
  onClose: () => void
  theme: 'light' | 'dark' | 'system'
  onToggleTheme: () => void
}

export const PreviewView: React.FC<PreviewViewProps> = ({
  content,
  filePath,
  onEdit,
  onClose,
  theme,
  onToggleTheme
}) => {
  return (
    <div className="flex flex-col h-screen w-screen bg-white dark:bg-black">
      {/* Minimal Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Back to home"
          >
            <svg
              className="w-5 h-5 text-gray-600 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
          </button>
          <div>
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
              {filePath ? filePath.split('/').pop() : 'Preview'}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Read-only mode</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            Edit Document
          </button>
        </div>
      </div>

      {/* Full-width Preview */}
      <div className="flex-1 overflow-hidden">
        <Preview content={content} />
      </div>
    </div>
  )
}
