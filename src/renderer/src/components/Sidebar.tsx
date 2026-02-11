import React from 'react'

export const Sidebar: React.FC = () => {
  return (
    <div className="w-64 h-full bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
      <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Usage</h2>
      <div className="prose dark:prose-invert text-sm">
        <p>Welcome to Markdown Viewer!</p>
        <ul className="list-disc pl-4 space-y-2">
          <li>Type markdown on the left.</li>
          <li>See live preview in the center.</li>
          <li>
            Use <strong>Cmd+S</strong> to save.
          </li>
          <li>
            Use <strong>Cmd+O</strong> to open.
          </li>
        </ul>
      </div>
    </div>
  )
}
