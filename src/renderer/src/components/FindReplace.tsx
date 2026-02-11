import React from 'react'

interface FindReplaceProps {
  content: string
  onReplace: (searchText: string, replaceText: string, replaceAll: boolean) => void
  onClose: () => void
}

export function FindReplace({ content, onReplace, onClose }: FindReplaceProps): React.ReactElement {
  const [searchText, setSearchText] = React.useState('')
  const [replaceText, setReplaceText] = React.useState('')
  const [caseSensitive, setCaseSensitive] = React.useState(false)
  const [matchCount, setMatchCount] = React.useState(0)

  React.useEffect(() => {
    if (!searchText) {
      setMatchCount(0)
      return
    }

    const flags = caseSensitive ? 'g' : 'gi'
    const regex = new RegExp(searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags)
    const matches = content.match(regex)
    setMatchCount(matches ? matches.length : 0)
  }, [searchText, content, caseSensitive])

  const handleReplace = () => {
    if (searchText) {
      onReplace(searchText, replaceText, false)
    }
  }

  const handleReplaceAll = () => {
    if (searchText) {
      onReplace(searchText, replaceText, true)
    }
  }

  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 flex-1">
        <input
          type="text"
          placeholder="Find"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="px-3 py-1.5 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
          autoFocus
        />

        <input
          type="text"
          placeholder="Replace"
          value={replaceText}
          onChange={(e) => setReplaceText(e.target.value)}
          className="px-3 py-1.5 text-sm bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
        />

        <label className="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={caseSensitive}
            onChange={(e) => setCaseSensitive(e.target.checked)}
            className="rounded"
          />
          <span>Aa</span>
        </label>

        {matchCount > 0 && (
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {matchCount} {matchCount === 1 ? 'match' : 'matches'}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleReplace}
          disabled={!searchText}
          className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Replace
        </button>

        <button
          onClick={handleReplaceAll}
          disabled={!searchText}
          className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Replace All
        </button>

        <button
          onClick={onClose}
          className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded hover:bg-gray-200 dark:hover:bg-gray-700"
          title="Close (Esc)"
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
  )
}
