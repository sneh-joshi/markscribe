import React from 'react'
import { Snapshot } from '../lib/versionHistory'

interface VersionHistoryProps {
  snapshots: Snapshot[]
  onRestore: (snapshot: Snapshot) => void
  onDelete: (id: string) => void
  onCreateManual: () => void
  onCompare: (snapshot: Snapshot) => void
}

export function VersionHistory({
  snapshots,
  onRestore,
  onDelete,
  onCreateManual,
  onCompare
}: VersionHistoryProps): React.ReactElement {
  const formatTimestamp = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes} min ago`
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
    return `${days} day${days > 1 ? 's' : ''} ago`
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Version History</h3>
          <button
            onClick={onCreateManual}
            className="px-2 py-1 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
            title="Create manual snapshot"
          >
            + Snapshot
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {snapshots.length} snapshot{snapshots.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {snapshots.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
            No snapshots yet. Snapshots are created automatically when you save.
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {snapshots.map((snapshot) => (
              <div
                key={snapshot.id}
                className="p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-900 dark:text-white">
                        {formatTimestamp(snapshot.timestamp)}
                      </span>
                      {snapshot.isManual && (
                        <span className="px-1.5 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                          Manual
                        </span>
                      )}
                    </div>
                    {snapshot.label && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                        {snapshot.label}
                      </div>
                    )}
                    <div className="text-xs text-gray-500 dark:text-gray-500">
                      {formatDate(snapshot.timestamp)} • {snapshot.wordCount} words
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => onCompare(snapshot)}
                      className="p-1.5 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded transition-colors"
                      title="Compare with current"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => onRestore(snapshot)}
                      className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                      title="Restore this version"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDelete(snapshot.id)}
                      className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                      title="Delete snapshot"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
