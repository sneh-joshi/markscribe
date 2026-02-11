import React from 'react'

interface StatusBarProps {
  content: string
  saveStatus?: 'saved' | 'saving' | 'unsaved'
}

export function StatusBar({ content, saveStatus }: StatusBarProps): React.ReactElement {
  const stats = React.useMemo(() => {
    const words = content.trim() ? content.trim().split(/\s+/).length : 0
    const characters = content.length
    const charactersNoSpaces = content.replace(/\s/g, '').length
    const paragraphs = content.split(/\n\n+/).filter((p) => p.trim()).length
    const readingTime = Math.ceil(words / 200) // 200 words per minute

    return {
      words,
      characters,
      charactersNoSpaces,
      paragraphs,
      readingTime
    }
  }, [content])

  const getSaveStatusText = () => {
    switch (saveStatus) {
      case 'saving':
        return '💾 Saving...'
      case 'saved':
        return '✓ Saved'
      case 'unsaved':
        return '● Unsaved changes'
      default:
        return ''
    }
  }

  return (
    <div className="flex items-center justify-between px-4 py-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="flex items-center gap-4">
        <span className="font-medium">{stats.words} words</span>
        <span>{stats.characters} characters</span>
        <span>{stats.charactersNoSpaces} characters (no spaces)</span>
        <span>{stats.paragraphs} paragraphs</span>
        <span>{stats.readingTime} min read</span>
      </div>

      {saveStatus && (
        <div className="flex items-center gap-2">
          <span
            className={`
            ${saveStatus === 'saved' ? 'text-green-600 dark:text-green-400' : ''}
            ${saveStatus === 'saving' ? 'text-blue-600 dark:text-blue-400' : ''}
            ${saveStatus === 'unsaved' ? 'text-orange-600 dark:text-orange-400' : ''}
          `}
          >
            {getSaveStatusText()}
          </span>
        </div>
      )}
    </div>
  )
}
