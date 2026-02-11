import { useState, useEffect } from 'react'
import { WelcomeScreen } from './components/WelcomeScreen'
import { PreviewView } from './components/PreviewView'
import { EditorView } from './components/EditorView'

type AppMode = 'welcome' | 'preview' | 'edit'

function App(): React.JSX.Element {
  const [mode, setMode] = useState<AppMode>('welcome')
  const [content, setContent] = useState<string>('# Hello World\nStart typing...')
  const [filePath, setFilePath] = useState<string>('')
  const [recentFiles, setRecentFiles] = useState<string[]>([])

  /* Theme Logic */
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system')

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null
    if (savedTheme) setTheme(savedTheme)

    // Load recent files from localStorage
    const saved = localStorage.getItem('recentFiles')
    if (saved) {
      try {
        setRecentFiles(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse recent files:', e)
      }
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    const apply = (isDark: boolean): void => {
      if (isDark) root.classList.add('dark')
      else root.classList.remove('dark')
    }

    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      apply(mediaQuery.matches)

      const handler = (e: MediaQueryListEvent): void => apply(e.matches)
      mediaQuery.addEventListener('change', handler)
      return (): void => mediaQuery.removeEventListener('change', handler)
    } else {
      apply(theme === 'dark')
      return (): void => {}
    }
  }, [theme])

  const toggleTheme = (): void => {
    const nextTheme = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system'
    setTheme(nextTheme)
    localStorage.setItem('theme', nextTheme)
  }

  // File operations
  const handleOpenFile = async (): Promise<void> => {
    const result = await window.api.openFile()
    if (result) {
      setContent(result.content)
      setFilePath(result.filePath)

      // Update recent files
      const updated = [result.filePath, ...recentFiles.filter((f) => f !== result.filePath)].slice(
        0,
        5
      )
      setRecentFiles(updated)
      localStorage.setItem('recentFiles', JSON.stringify(updated))
    }
  }

  const handleSaveFile = async (): Promise<void> => {
    const result = await window.api.saveFile(filePath, content)
    if (result) {
      setFilePath(result.filePath)

      // Update recent files
      const updated = [result.filePath, ...recentFiles.filter((f) => f !== result.filePath)].slice(
        0,
        5
      )
      setRecentFiles(updated)
      localStorage.setItem('recentFiles', JSON.stringify(updated))
    }
  }

  // Mode handlers
  const handleNewDocument = (): void => {
    setContent('# New Document\n\nStart writing...')
    setFilePath('')
    setMode('edit')
  }

  const handleEditDocument = async (): Promise<void> => {
    await handleOpenFile()
    setMode('edit')
  }

  const handlePreviewDocument = async (): Promise<void> => {
    await handleOpenFile()
    setMode('preview')
  }

  const handleBackToWelcome = (): void => {
    setMode('welcome')
  }

  const handleSwitchToEdit = (): void => {
    setMode('edit')
  }

  const handleFileDropped = (fileName: string, fileContent: string): void => {
    setContent(fileContent)
    setFilePath(fileName)
    setMode('edit')

    // Update recent files
    const updated = [fileName, ...recentFiles.filter((f) => f !== fileName)].slice(0, 5)
    setRecentFiles(updated)
    localStorage.setItem('recentFiles', JSON.stringify(updated))
  }

  const handleLoadRecentFile = async (filePath: string): Promise<void> => {
    try {
      const result = await window.api.loadFileByPath(filePath)
      if (result) {
        setContent(result.content)
        setFilePath(result.filePath)
        setMode('edit')

        // Update recent files (move to top)
        const updated = [
          result.filePath,
          ...recentFiles.filter((f) => f !== result.filePath)
        ].slice(0, 5)
        setRecentFiles(updated)
        localStorage.setItem('recentFiles', JSON.stringify(updated))
      } else {
        // File not found or couldn't be loaded
        alert(`Could not open file: ${filePath}\n\nThe file may have been moved or deleted.`)

        // Remove from recent files
        const updated = recentFiles.filter((f) => f !== filePath)
        setRecentFiles(updated)
        localStorage.setItem('recentFiles', JSON.stringify(updated))
      }
    } catch (error) {
      console.error('Error loading recent file:', error)
      alert(
        `Error opening file: ${filePath}\n\n${error instanceof Error ? error.message : 'Unknown error'}`
      )

      // Remove from recent files on error
      const updated = recentFiles.filter((f) => f !== filePath)
      setRecentFiles(updated)
      localStorage.setItem('recentFiles', JSON.stringify(updated))
    }
  }

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent): Promise<void> => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'o') {
        e.preventDefault()
        await handleOpenFile()
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        await handleSaveFile()
      }
      // Theme toggle
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 't') {
        e.preventDefault()
        toggleTheme()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return (): void => window.removeEventListener('keydown', handleKeyDown)
  }, [content, filePath])

  // Render based on mode
  if (mode === 'welcome') {
    return (
      <WelcomeScreen
        onNewDocument={handleNewDocument}
        onEditDocument={handleEditDocument}
        onPreviewDocument={handlePreviewDocument}
        recentFiles={recentFiles}
        theme={theme}
        onToggleTheme={toggleTheme}
        onFileDropped={handleFileDropped}
        onLoadRecentFile={handleLoadRecentFile}
      />
    )
  }

  if (mode === 'preview') {
    return (
      <PreviewView
        content={content}
        filePath={filePath}
        onEdit={handleSwitchToEdit}
        onClose={handleBackToWelcome}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    )
  }

  return (
    <EditorView
      content={content}
      filePath={filePath}
      onChange={setContent}
      onSave={handleSaveFile}
      onClose={handleBackToWelcome}
      theme={theme}
      onToggleTheme={toggleTheme}
    />
  )
}

export default App
