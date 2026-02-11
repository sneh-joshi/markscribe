import React from 'react'

interface ThemeToggleProps {
  theme: 'light' | 'dark' | 'system'
  onToggle: () => void
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onToggle }) => {
  return (
    <button
      onClick={onToggle}
      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
      title={`Theme: ${theme}`}
    >
      <span className="text-lg">{theme === 'light' ? '☀️' : theme === 'dark' ? '🌙' : '🖥️'}</span>
    </button>
  )
}
