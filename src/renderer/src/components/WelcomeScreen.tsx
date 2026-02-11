import React from 'react'
import { ThemeToggle } from './ThemeToggle'

interface WelcomeScreenProps {
  onNewDocument: () => void
  onEditDocument: () => void
  onPreviewDocument: () => void
  onFileDropped: (fileName: string, fileContent: string) => void
  onLoadRecentFile: (filePath: string) => void
  recentFiles: string[]
  theme: 'light' | 'dark' | 'system'
  onToggleTheme: () => void
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onNewDocument,
  onEditDocument,
  onPreviewDocument,
  onFileDropped,
  onLoadRecentFile,
  recentFiles,
  theme,
  onToggleTheme
}) => {
  const [isDragging, setIsDragging] = React.useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    const mdFile = files.find((f) => f.name.endsWith('.md') || f.name.endsWith('.markdown'))

    if (mdFile && onFileDropped) {
      // Read the file content
      const content = await mdFile.text()
      onFileDropped(mdFile.name, content)
    }
  }

  return (
    <div
      className="relative flex items-center justify-center min-h-screen w-screen bg-white dark:bg-gray-950"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag and Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-500/10 dark:bg-blue-400/10 backdrop-blur-sm z-50 flex items-center justify-center border-4 border-dashed border-blue-500 dark:border-blue-400">
          <div className="text-center">
            <div className="text-6xl mb-4">📄</div>
            <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
              Drop your Markdown file here
            </p>
          </div>
        </div>
      )}

      {/* Theme Toggle - Top Right */}
      <div className="absolute top-8 right-8 z-10">
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-5xl w-full px-12">
        {/* Header */}
        <div className="text-center mb-20">
          <h1 className="text-6xl font-bold mb-4 text-gray-900 dark:text-white tracking-tight">
            MarkScribe
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400">
            Your powerful markdown editor with live preview
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
          {/* New Document Card */}
          <button
            onClick={onNewDocument}
            className="group flex flex-col items-center p-10 bg-gray-50 dark:bg-gray-900 rounded-3xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
          >
            <div className="w-20 h-20 mb-6 bg-blue-500 dark:bg-blue-600 rounded-2xl flex items-center justify-center text-4xl group-hover:scale-105 transition-transform">
              ✏️
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              New Document
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Start writing from scratch
            </p>
          </button>

          {/* Edit Existing Card */}
          <button
            onClick={onEditDocument}
            className="group flex flex-col items-center p-10 bg-gray-50 dark:bg-gray-900 rounded-3xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
          >
            <div className="w-20 h-20 mb-6 bg-blue-500 dark:bg-blue-600 rounded-2xl flex items-center justify-center text-4xl group-hover:scale-105 transition-transform">
              📂
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Edit Existing
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              Open and modify a file
            </p>
          </button>

          {/* Preview File Card */}
          <button
            onClick={onPreviewDocument}
            className="group flex flex-col items-center p-10 bg-gray-50 dark:bg-gray-900 rounded-3xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
          >
            <div className="w-20 h-20 mb-6 bg-blue-500 dark:bg-blue-600 rounded-2xl flex items-center justify-center text-4xl group-hover:scale-105 transition-transform">
              👁️
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Preview File
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              View in read-only mode
            </p>
          </button>
        </div>

        {/* Recent Files */}
        {recentFiles.length > 0 && (
          <div className="max-w-2xl mx-auto">
            <h4 className="text-sm font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">
              Recent Files
            </h4>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl divide-y divide-gray-200 dark:divide-gray-800">
              {recentFiles.slice(0, 5).map((file, index) => (
                <button
                  key={index}
                  onClick={() => onLoadRecentFile(file)}
                  className="w-full px-6 py-5 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-4 group first:rounded-t-2xl last:rounded-b-2xl"
                >
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-800 rounded-xl flex items-center justify-center flex-shrink-0">
                    <span className="text-2xl">📄</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-medium text-gray-900 dark:text-white truncate">
                      {file.split('/').pop()}
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 truncate mt-0.5">
                      {file}
                    </p>
                  </div>
                  <svg
                    className="w-5 h-5 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Tip - Fixed to bottom */}
      <div className="absolute bottom-8 left-0 right-0 text-center">
        <p className="text-sm text-gray-400 dark:text-gray-600">
          💡 Tip: Drag and drop a .md file anywhere to get started
        </p>
      </div>
    </div>
  )
}
