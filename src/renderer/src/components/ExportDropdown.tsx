import React, { useState, useRef, useEffect } from 'react'

interface ExportDropdownProps {
  onExportPDF: () => void
  onExportHTML: () => void
  onExportDOCX: () => void
}

export function ExportDropdown({
  onExportPDF,
  onExportHTML,
  onExportDOCX
}: ExportDropdownProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleExport = (exportFn: () => void) => {
    exportFn()
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-sm font-medium rounded-lg transition-colors shadow-sm flex items-center gap-2"
      >
        <span>Export</span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
          <button
            onClick={() => handleExport(onExportPDF)}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
          >
            <span className="text-lg">📄</span>
            <span>Export as PDF</span>
          </button>

          <button
            onClick={() => handleExport(onExportHTML)}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
          >
            <span className="text-lg">🌐</span>
            <span>Export as HTML</span>
          </button>

          <button
            onClick={() => handleExport(onExportDOCX)}
            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-3"
          >
            <span className="text-lg">📝</span>
            <span>Export as DOCX</span>
          </button>
        </div>
      )}
    </div>
  )
}
