import React, { useState } from 'react'
import { VersionHistory } from './VersionHistory'
import { Snapshot } from '../lib/versionHistory'

interface RightSidebarProps {
  snapshots: Snapshot[]
  onRestoreSnapshot: (snapshot: Snapshot) => void
  onDeleteSnapshot: (id: string) => void
  onCreateManualSnapshot: () => void
  onCompare: (snapshot: Snapshot) => void
  spellCheck: boolean
  onToggleSpellCheck: (enabled: boolean) => void
  theme: 'light' | 'dark' | 'system'
  onToggleTheme: () => void
  onOpenAIEditor: () => void
  onOpenAISettings: () => void
}

type ActivePanel = 'history' | 'settings'

export function RightSidebar({
  snapshots,
  onRestoreSnapshot,
  onDeleteSnapshot,
  onCreateManualSnapshot,
  onCompare,
  spellCheck,
  onToggleSpellCheck,
  theme,
  onToggleTheme,
  onOpenAIEditor,
  onOpenAISettings
}: RightSidebarProps): React.ReactElement {
  const [activePanel, setActivePanel] = useState<ActivePanel>('history')

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={() => setActivePanel('history')}
          className={`flex-1 px-4 py-3 text-xs font-medium transition-colors ${
            activePanel === 'history'
              ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          🕐 History
        </button>
        <button
          onClick={() => setActivePanel('settings')}
          className={`flex-1 px-4 py-3 text-xs font-medium transition-colors ${
            activePanel === 'settings'
              ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          ⚙️ Settings
        </button>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-hidden bg-white dark:bg-gray-800">
        {activePanel === 'history' && (
          <VersionHistory
            snapshots={snapshots}
            onRestore={onRestoreSnapshot}
            onDelete={onDeleteSnapshot}
            onCreateManual={onCreateManualSnapshot}
            onCompare={onCompare}
          />
        )}

        {activePanel === 'settings' && (
          <div className="p-4 space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-3">
                Editor Settings
              </h3>

              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Spell Check</span>
                  <input
                    type="checkbox"
                    checked={spellCheck}
                    onChange={(e) => onToggleSpellCheck(e.target.checked)}
                    className="rounded"
                  />
                </label>

                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Theme</span>
                  </div>
                  <button
                    onClick={onToggleTheme}
                    className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded transition-colors"
                  >
                    {theme === 'light' && '☀️ Light'}
                    {theme === 'dark' && '🌙 Dark'}
                    {theme === 'system' && '💻 System'}
                  </button>
                </div>

                <div className="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-700 dark:text-gray-300">AI Assistant</span>
                  </div>

                  <button
                    onClick={onOpenAIEditor}
                    className="w-full px-3 py-2 text-sm font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800 rounded transition-colors"
                    title="Open AI Editor (Cmd+Shift+A)"
                  >
                    ✨ AI Editor
                  </button>

                  <button
                    onClick={onOpenAISettings}
                    className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded transition-colors"
                    title="Open AI Assistant Settings"
                  >
                    ⚙️ AI Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
