import React, { useState, useEffect, useRef } from 'react'
import { Editor } from './Editor'
import { Preview } from './Preview'
import { ThemeToggle } from './ThemeToggle'
import { FocusMode } from './FocusMode'
import { StatusBar } from './StatusBar'
import { FindReplace } from './FindReplace'
import { ExportDropdown } from './ExportDropdown'
import { RightSidebar } from './RightSidebar'
import { DiffViewer } from './DiffViewer'
import { AISettings } from './AISettings'
import { createSnapshot, getSnapshots, deleteSnapshot, Snapshot } from '../lib/versionHistory'
import { loadAIConfig } from '../lib/ai/config'
import { aiProviderManager } from '../lib/ai/provider-manager'
import { useAIAutoComplete } from './AIAutoComplete'
import { AICommandPalette } from './AICommandPalette'

interface EditorViewProps {
  content: string
  filePath: string
  onChange: (value: string) => void
  onSave: () => void
  onClose: () => void
  theme: 'light' | 'dark' | 'system'
  onToggleTheme: () => void
}

type SaveStatus = 'saved' | 'saving' | 'unsaved'

type ViewMode = 'edit' | 'split' | 'preview'

export const EditorView: React.FC<EditorViewProps> = ({
  content,
  filePath,
  onChange,
  onSave,
  onClose,
  theme,
  onToggleTheme
}) => {
  const [viewMode] = useState<ViewMode>('edit')
  const [focusMode, setFocusMode] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [showFindReplace, setShowFindReplace] = useState(false)
  const [spellCheck, setSpellCheck] = useState(true)
  const [showRightSidebar, setShowRightSidebar] = useState(true)
  const [showAISettings, setShowAISettings] = useState(false)
  const [showAICommandPalette, setShowAICommandPalette] = useState(false)
  const [aiEnabled, setAiEnabled] = useState(false)
  const [aiSuggestionRefreshToken] = useState(0)
  const [cursorPosition, setCursorPosition] = useState(0)
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number }>({
    start: 0,
    end: 0
  })
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [compareSnapshot, setCompareSnapshot] = useState<Snapshot | null>(null)
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedContentRef = useRef(content)

  // Initialize AI provider from saved config.
  useEffect(() => {
    const saved = loadAIConfig()
    if (saved?.enabled) {
      setAiEnabled(true)
      try {
        aiProviderManager.setProvider(saved)
      } catch (error) {
        console.error('Failed to initialize AI provider:', error)
      }
    } else {
      setAiEnabled(false)
      aiProviderManager.clear()
    }
  }, [])

  const handleCloseAISettings = (): void => {
    setShowAISettings(false)

    const saved = loadAIConfig()
    if (saved?.enabled) {
      setAiEnabled(true)
      try {
        aiProviderManager.setProvider(saved)
      } catch (error) {
        console.error('Failed to initialize AI provider:', error)
      }
    } else {
      setAiEnabled(false)
      aiProviderManager.clear()
    }
  }

  const { suggestion, clearSuggestion, consumeSuggestionPrefix } = useAIAutoComplete({
    content,
    cursorPosition,
    enabled: aiEnabled,
    refreshToken: aiSuggestionRefreshToken
  })

  // Auto-save logic
  useEffect(() => {
    if (content !== lastSavedContentRef.current && filePath) {
      setSaveStatus('unsaved')

      // Clear existing timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }

      // Set new timer for auto-save (5 seconds)
      autoSaveTimerRef.current = setTimeout(() => {
        setSaveStatus('saving')
        onSave()
        lastSavedContentRef.current = content
        setTimeout(() => setSaveStatus('saved'), 500)
      }, 5000)
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [content, filePath, onSave])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + S: Save
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        onSave()
        setSaveStatus('saved')
        lastSavedContentRef.current = content

        // Create snapshot on manual save
        const snapshotPath = filePath && filePath !== 'Untitled.md' ? filePath : 'untitled'
        createSnapshot(snapshotPath, content, false).then(() => {
          getSnapshots(snapshotPath).then(setSnapshots)
        })
      }

      // Cmd/Ctrl + F: Find & Replace
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault()
        setShowFindReplace(true)
      }

      // Cmd/Ctrl + B: Toggle Sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault()
        setShowRightSidebar((prev) => !prev)
      }

      // Cmd/Ctrl + Shift + A: AI Command Palette
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault()
        setShowAICommandPalette(true)
      }

      // Escape: Close Find & Replace
      if (e.key === 'Escape' && showFindReplace) {
        setShowFindReplace(false)
      }

      // Escape: Close AI palette
      if (e.key === 'Escape' && showAICommandPalette) {
        setShowAICommandPalette(false)
      }

      // Escape: dismiss inline suggestion only
      if (e.key === 'Escape' && aiEnabled) {
        clearSuggestion()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    onSave,
    content,
    showFindReplace,
    showAICommandPalette,
    aiEnabled,
    clearSuggestion
  ])

  const selectedText = React.useMemo(() => {
    const start = Math.min(selectionRange.start, selectionRange.end)
    const end = Math.max(selectionRange.start, selectionRange.end)
    if (start === end) return ''
    return content.slice(start, end)
  }, [content, selectionRange.end, selectionRange.start])

  const aiTargetText = selectedText.trim().length > 0 ? selectedText : content
  const applyLabel = selectedText.trim().length > 0 ? 'Replace Selection' : 'Replace Document'

  const applyAIReplacement = (replacement: string): void => {
    if (selectedText.trim().length > 0) {
      const start = Math.min(selectionRange.start, selectionRange.end)
      const end = Math.max(selectionRange.start, selectionRange.end)
      onChange(content.slice(0, start) + replacement + content.slice(end))
      setSelectionRange({ start: start + replacement.length, end: start + replacement.length })
      setCursorPosition(start + replacement.length)
      return
    }

    onChange(replacement)
    setSelectionRange({ start: 0, end: 0 })
    setCursorPosition(0)
  }

  // Load snapshots on mount and when file changes
  useEffect(() => {
    if (filePath) {
      getSnapshots(filePath).then(setSnapshots)
    }
  }, [filePath])

  const handleRestoreSnapshot = (snapshot: Snapshot) => {
    if (confirm(`Restore version from ${new Date(snapshot.timestamp).toLocaleString()}?`)) {
      onChange(snapshot.content)
    }
  }

  const handleDeleteSnapshot = async (id: string) => {
    if (confirm('Delete this snapshot?')) {
      await deleteSnapshot(id)
      if (filePath) {
        const updated = await getSnapshots(filePath)
        setSnapshots(updated)
      }
    }
  }

  const handleCreateManualSnapshot = async () => {
    // Use 'untitled' as identifier for unsaved files
    const snapshotPath = filePath && filePath !== 'Untitled.md' ? filePath : 'untitled'
    const label = prompt('Enter a label for this snapshot (optional):')
    await createSnapshot(snapshotPath, content, true, label || undefined)
    const updated = await getSnapshots(snapshotPath)
    setSnapshots(updated)
  }

  const handleFindReplace = (searchText: string, replaceText: string, replaceAll: boolean) => {
    const flags = replaceAll ? 'g' : ''
    const regex = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags)
    const newContent = replaceAll
      ? content.replace(regex, replaceText)
      : content.replace(regex, replaceText)
    onChange(newContent)
  }

  const handleExportHTML = async () => {
    const filePath = await window.api.exportToHTML(content)
    if (filePath) {
      alert(`Exported to HTML: ${filePath}`)
    }
  }

  const handleExportDOCX = async () => {
    const filePath = await window.api.exportToDOCX(content)
    if (filePath) {
      alert(`Exported to DOCX: ${filePath}`)
    }
  }

  const handleCompareSnapshot = (snapshot: Snapshot) => {
    setCompareSnapshot(snapshot)
  }

  const handleExportPDF = async () => {
    // Parse markdown to HTML properly
    const lines = content.split('\n')
    let html = ''
    let inCodeBlock = false
    let inList = false

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()

      // Handle code blocks
      if (trimmed.startsWith('```')) {
        if (inCodeBlock) {
          html += '</code></pre>\n'
          inCodeBlock = false
        } else {
          const language = trimmed.substring(3).trim()
          html += `<pre><code class="language-${language}">`
          inCodeBlock = true
        }
        continue
      }

      if (inCodeBlock) {
        html += line + '\n'
        continue
      }

      // Handle headings
      if (trimmed.startsWith('#### ')) {
        html += '<h4>' + trimmed.substring(5) + '</h4>\n'
      } else if (trimmed.startsWith('### ')) {
        html += '<h3>' + trimmed.substring(4) + '</h3>\n'
      } else if (trimmed.startsWith('## ')) {
        html += '<h2>' + trimmed.substring(3) + '</h2>\n'
      } else if (trimmed.startsWith('# ')) {
        html += '<h1>' + trimmed.substring(2) + '</h1>\n'
      }
      // Handle lists
      else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        if (!inList) {
          html += '<ul>\n'
          inList = true
        }
        html += '<li>' + trimmed.substring(2) + '</li>\n'
      } else if (trimmed.match(/^\d+\. /)) {
        if (!inList) {
          html += '<ol>\n'
          inList = true
        }
        html += '<li>' + trimmed.replace(/^\d+\. /, '') + '</li>\n'
      } else {
        if (inList) {
          html += '</ul>\n'
          inList = false
        }
        // Handle blockquotes
        if (trimmed.startsWith('> ')) {
          html += '<blockquote>' + trimmed.substring(2) + '</blockquote>\n'
        }
        // Handle empty lines
        else if (trimmed === '') {
          html += '<br>\n'
        }
        // Regular paragraphs with inline formatting
        else {
          let formatted = line
          formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>')
          formatted = formatted.replace(/`(.+?)`/g, '<code>$1</code>')
          formatted = formatted.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
          html += '<p>' + formatted + '</p>\n'
        }
      }
    }

    // Close any open lists
    if (inList) {
      html += '</ul>\n'
    }

    // Generate HTML with proper markdown rendering
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #1f2937;
              max-width: 800px;
              margin: 40px auto;
              padding: 20px;
            }
            h1, h2, h3, h4, h5, h6 {
              margin-top: 24px;
              margin-bottom: 16px;
              font-weight: 600;
              line-height: 1.25;
              page-break-after: avoid;
            }
            h1 { font-size: 2em; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
            h2 { font-size: 1.5em; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
            h3 { font-size: 1.25em; }
            p { margin-top: 0; margin-bottom: 16px; }
            code {
              background-color: #f3f4f6;
              padding: 2px 6px;
              border-radius: 3px;
              font-family: 'Courier New', Consolas, Monaco, monospace;
              font-size: 0.9em;
              color: #1f2937;
            }
            pre {
              background-color: #1e1e1e;
              color: #d4d4d4;
              padding: 16px;
              border-radius: 6px;
              overflow-x: auto;
              margin: 16px 0;
              page-break-inside: avoid;
            }
            pre code {
              background-color: transparent;
              padding: 0;
              color: #d4d4d4;
              font-size: 0.875em;
              line-height: 1.5;
            }
            blockquote {
              border-left: 4px solid #e5e7eb;
              padding-left: 16px;
              margin-left: 0;
              margin: 16px 0;
              color: #6b7280;
              font-style: italic;
            }
            a {
              color: #2563eb;
              text-decoration: none;
            }
            a:hover {
              text-decoration: underline;
            }
            ul, ol {
              padding-left: 24px;
              margin: 16px 0;
            }
            li {
              margin: 4px 0;
            }
            table {
              border-collapse: collapse;
              width: 100%;
              margin: 16px 0;
            }
            th, td {
              border: 1px solid #e5e7eb;
              padding: 8px 12px;
              text-align: left;
            }
            th {
              background-color: #f9fafb;
              font-weight: 600;
            }
            tr:nth-child(even) {
              background-color: #f9fafb;
            }
            img {
              max-width: 100%;
              height: auto;
              border-radius: 6px;
            }
          </style>
        </head>
        <body>
          <div class="markdown-body">
            ${html}
          </div>
        </body>
      </html>
    `

    try {
      const result = await window.api.exportToPDF(htmlContent)
      if (!result.success) {
        console.error('PDF export failed:', result.message)
      }
    } catch (error) {
      console.error('PDF export error:', error)
    }
  }

  // Render Focus Mode if active
  if (focusMode) {
    return (
      <FocusMode
        content={content}
        onChange={onChange}
        onExit={() => setFocusMode(false)}
        theme={theme}
      />
    )
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-white dark:bg-black">
      {/* Header with View Mode Toggle */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
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
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
          </button>
          <div className="flex flex-col">
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {filePath ? filePath.split('/').pop() : 'Untitled.md'}
            </div>
            {filePath && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(filePath)
                  alert('Path copied!')
                }}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-left truncate max-w-md"
                title="Click to copy full path"
              >
                {filePath}
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAICommandPalette(true)}
            className="px-3 py-1.5 text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800 rounded-md transition-all"
            title="Open AI Editor (Cmd+Shift+A)"
          >
            ✨ AI Editor
          </button>

          <button
            onClick={() => setShowAISettings(true)}
            className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-700 rounded-md transition-all"
            title="Open AI Assistant Settings"
          >
            ⚙️ AI Settings
          </button>

          <button
            onClick={() => setFocusMode(true)}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-700 rounded-md transition-all"
            title="Enter Focus Mode (distraction-free writing)"
          >
            🎯 Focus
          </button>

          <button
            onClick={() => setShowFindReplace(!showFindReplace)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-all"
            title="Find & Replace (Cmd+F)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>

          <button
            onClick={() => setSpellCheck(!spellCheck)}
            className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-all ${spellCheck ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
              }`}
            title="Spell Check"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </button>

          <ThemeToggle theme={theme} onToggle={onToggleTheme} />

          <button
            onClick={() => setShowRightSidebar(!showRightSidebar)}
            className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-all ${showRightSidebar
              ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
              : 'text-gray-600 dark:text-gray-400'
              }`}
            title="Toggle Sidebar (Ctrl+B)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <ExportDropdown
            onExportPDF={handleExportPDF}
            onExportHTML={handleExportHTML}
            onExportDOCX={handleExportDOCX}
          />

          <button
            onClick={onSave}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            Save
          </button>
        </div>
      </div>

      {/* Find & Replace Bar */}
      {showFindReplace && (
        <FindReplace
          content={content}
          onReplace={handleFindReplace}
          onClose={() => setShowFindReplace(false)}
        />
      )}

      {/* Main Content Area with Right Sidebar */}
      <div className="flex-1 overflow-hidden flex">
        {/* Editor/Preview Area */}
        <div className="flex-1 overflow-hidden">
          {viewMode === 'edit' && (
            <div className="h-full flex flex-col">
              <div className="flex-1 overflow-hidden">
                <Editor
                  content={content}
                  onChange={onChange}
                  theme={theme}
                  spellCheck={spellCheck}
                  onCursorPositionChange={setCursorPosition}
                  onSelectionChange={(start, end) => setSelectionRange({ start, end })}
                  aiSuggestion={aiEnabled ? suggestion : undefined}
                  onSuggestionAccepted={clearSuggestion}
                  onSuggestionPartiallyAccepted={consumeSuggestionPrefix}
                />
              </div>

              <StatusBar content={content} saveStatus={saveStatus} />
            </div>
          )}

          {viewMode === 'split' && (
            <div className="h-full flex flex-col">
              <div className="flex-1 grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-800 overflow-hidden">
                <div className="h-full overflow-hidden">
                  <Editor
                    content={content}
                    onChange={onChange}
                    theme={theme}
                    spellCheck={spellCheck}
                    onCursorPositionChange={setCursorPosition}
                    onSelectionChange={(start, end) => setSelectionRange({ start, end })}
                    aiSuggestion={aiEnabled ? suggestion : undefined}
                    onSuggestionAccepted={clearSuggestion}
                    onSuggestionPartiallyAccepted={consumeSuggestionPrefix}
                  />
                </div>
                <div className="h-full overflow-hidden">
                  <Preview content={content} />
                </div>
              </div>

              <StatusBar content={content} saveStatus={saveStatus} />
            </div>
          )}

          {viewMode === 'preview' && (
            <div className="h-full w-full">
              <Preview content={content} />
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        {showRightSidebar && (
          <div className="w-80 h-full">
            <RightSidebar
              snapshots={snapshots}
              onRestoreSnapshot={handleRestoreSnapshot}
              onDeleteSnapshot={handleDeleteSnapshot}
              onCreateManualSnapshot={handleCreateManualSnapshot}
              onCompare={handleCompareSnapshot}
              spellCheck={spellCheck}
              onToggleSpellCheck={setSpellCheck}
              theme={theme}
              onToggleTheme={onToggleTheme}
              onOpenAIEditor={() => setShowAICommandPalette(true)}
              onOpenAISettings={() => setShowAISettings(true)}
            />
          </div>
        )}
      </div>

      {/* AI Command Palette */}
      <AICommandPalette
        isOpen={showAICommandPalette}
        onClose={() => setShowAICommandPalette(false)}
        targetText={aiTargetText}
        applyLabel={applyLabel}
        onApply={applyAIReplacement}
      />

      {/* AI Settings Modal */}
      {showAISettings && <AISettings onClose={handleCloseAISettings} />}

      {/* Diff Viewer Modal */}
      {compareSnapshot && (
        <DiffViewer
          oldContent={compareSnapshot.content}
          newContent={content}
          oldLabel={`Snapshot from ${new Date(compareSnapshot.timestamp).toLocaleString()}`}
          newLabel="Current Version"
          onClose={() => setCompareSnapshot(null)}
          onRestore={() => handleRestoreSnapshot(compareSnapshot)}
          theme={theme}
        />
      )}
    </div>
  )
}
