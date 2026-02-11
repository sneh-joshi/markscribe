import React from 'react'
import MDEditor from '@uiw/react-md-editor'
import '@uiw/react-md-editor/markdown-editor.css'

interface EditorProps {
  content: string
  onChange: (value: string) => void
  theme?: 'light' | 'dark' | 'system'
  spellCheck?: boolean
}

export const Editor: React.FC<EditorProps> = ({
  content,
  onChange,
  theme = 'system',
  spellCheck = true
}) => {
  // Determine the actual color mode
  const getColorMode = () => {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return theme
  }

  const colorMode = getColorMode()

  return (
    <div className="h-full w-full flex flex-col" data-color-mode={colorMode}>
      <style>{`
        /* Make toolbar buttons bigger */
        .w-md-editor-toolbar {
          padding: 10px 12px !important;
        }
        .w-md-editor-toolbar button {
          width: 32px !important;
          height: 32px !important;
        }
        .w-md-editor-toolbar svg {
          width: 16px !important;
          height: 16px !important;
        }
      `}</style>
      <MDEditor
        value={content}
        onChange={(val) => onChange(val || '')}
        height="100%"
        visibleDragbar={false}
        preview="edit"
        hideToolbar={false}
        textareaProps={{
          spellCheck: spellCheck
        }}
      />
    </div>
  )
}
