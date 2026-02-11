import React from 'react'

interface ToolbarProps {
  onFormat: (format: string) => void
}

export const Toolbar: React.FC<ToolbarProps> = ({ onFormat }) => {
  const tools = [
    { icon: 'B', label: 'Bold', action: 'bold', shortcut: 'Cmd+B' },
    { icon: 'I', label: 'Italic', action: 'italic', shortcut: 'Cmd+I' },
    { icon: 'S', label: 'Strikethrough', action: 'strike', shortcut: '' },
    { icon: '<>', label: 'Code', action: 'code', shortcut: 'Cmd+E' },
    { icon: 'H1', label: 'Heading', action: 'heading', shortcut: '' },
    { icon: '•', label: 'Bullet List', action: 'ul', shortcut: '' },
    { icon: '1.', label: 'Numbered List', action: 'ol', shortcut: '' },
    { icon: '🔗', label: 'Link', action: 'link', shortcut: 'Cmd+K' },
    { icon: '🖼️', label: 'Image', action: 'image', shortcut: '' },
    { icon: '❝', label: 'Quote', action: 'quote', shortcut: '' }
  ]

  return (
    <div className="flex items-center gap-1 px-6 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
      {tools.map((tool) => (
        <button
          key={tool.action}
          onClick={() => onFormat(tool.action)}
          className="group relative px-3 py-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
          title={`${tool.label}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}
        >
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {tool.icon}
          </span>

          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            {tool.label}
            {tool.shortcut && <span className="ml-2 text-gray-400">{tool.shortcut}</span>}
          </div>
        </button>
      ))}
    </div>
  )
}
