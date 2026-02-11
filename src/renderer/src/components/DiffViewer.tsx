import React, { useEffect } from 'react'
import ReactDiffViewer from 'react-diff-viewer-continued'

interface DiffViewerProps {
  oldContent: string
  newContent: string
  oldLabel: string
  newLabel: string
  onClose: () => void
  onRestore?: () => void
  theme: 'light' | 'dark' | 'system'
}

export function DiffViewer({
  oldContent,
  newContent,
  oldLabel,
  newLabel,
  onClose,
  onRestore,
  theme
}: DiffViewerProps): React.ReactElement {
  // Handle ESC key to close
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const isDark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[95vw] h-[90vh] bg-white dark:bg-gray-900 rounded-lg shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Compare Versions
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              <span className="font-medium text-red-600 dark:text-red-400">{oldLabel}</span>
              {' vs '}
              <span className="font-medium text-green-600 dark:text-green-400">{newLabel}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onRestore && (
              <button
                onClick={() => {
                  onRestore()
                  onClose()
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Restore This Version
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
              title="Close (ESC)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Diff Content */}
        <div className="flex-1 overflow-auto">
          <ReactDiffViewer
            oldValue={oldContent}
            newValue={newContent}
            splitView={true}
            useDarkTheme={isDark}
            leftTitle={oldLabel}
            rightTitle={newLabel}
            showDiffOnly={false}
            styles={{
              variables: {
                dark: {
                  diffViewerBackground: '#1f2937',
                  diffViewerColor: '#f9fafb',
                  addedBackground: '#064e3b',
                  addedColor: '#d1fae5',
                  removedBackground: '#7f1d1d',
                  removedColor: '#fee2e2',
                  wordAddedBackground: '#065f46',
                  wordRemovedBackground: '#991b1b',
                  addedGutterBackground: '#064e3b',
                  removedGutterBackground: '#7f1d1d',
                  gutterBackground: '#374151',
                  gutterBackgroundDark: '#1f2937',
                  highlightBackground: '#374151',
                  highlightGutterBackground: '#4b5563'
                },
                light: {
                  diffViewerBackground: '#ffffff',
                  diffViewerColor: '#1f2937',
                  addedBackground: '#d1fae5',
                  addedColor: '#065f46',
                  removedBackground: '#fee2e2',
                  removedColor: '#991b1b',
                  wordAddedBackground: '#a7f3d0',
                  wordRemovedBackground: '#fecaca',
                  addedGutterBackground: '#d1fae5',
                  removedGutterBackground: '#fee2e2',
                  gutterBackground: '#f3f4f6',
                  gutterBackgroundDark: '#e5e7eb',
                  highlightBackground: '#f3f4f6',
                  highlightGutterBackground: '#e5e7eb'
                }
              },
              line: {
                padding: '8px 2px',
                fontSize: '14px',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
              }
            }}
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-green-200 dark:bg-green-900 rounded"></span>
                Added
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-red-200 dark:bg-red-900 rounded"></span>
                Removed
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-yellow-200 dark:bg-yellow-900 rounded"></span>
                Modified
              </span>
            </div>
            <span>Press ESC to close</span>
          </div>
        </div>
      </div>
    </div>
  )
}
