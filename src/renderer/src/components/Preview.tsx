import React, { useEffect, useRef } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import mermaid from 'mermaid'

interface PreviewProps {
  content: string
}

export const Preview: React.FC<PreviewProps> = ({ content }) => {
  const mermaidRef = useRef<boolean>(false)

  useEffect(() => {
    // Initialize mermaid only once
    if (!mermaidRef.current) {
      mermaid.initialize({
        startOnLoad: false,
        theme: document.documentElement.classList.contains('dark') ? 'dark' : 'default',
        securityLevel: 'loose',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        logLevel: 'error'
      })
      mermaidRef.current = true
    }

    // Re-render mermaid diagrams when content changes
    const renderMermaid = async () => {
      try {
        const mermaidElements = document.querySelectorAll('.mermaid')
        mermaidElements.forEach((element) => {
          element.removeAttribute('data-processed')
        })
        await mermaid.run({
          querySelector: '.mermaid'
        })
      } catch (error) {
        console.error('Mermaid rendering error:', error)
      }
    }

    // Small delay to ensure DOM is ready
    const timer = setTimeout(renderMermaid, 100)
    return () => clearTimeout(timer)
  }, [content])

  return (
    <div className="h-full w-full p-8 overflow-y-auto bg-transparent text-gray-900 dark:text-gray-200">
      <div className="prose dark:prose-invert max-w-none prose-headings:font-semibold prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-code:font-mono prose-code:text-sm prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:rounded prose-code:px-1 prose-code:py-0.5 prose-pre:bg-gray-100 dark:prose-pre:bg-[#1e1e1e] prose-pre:p-0 prose-pre:rounded-md leading-7 group-data-[color-mode=light]:text-black group-data-[color-mode=dark]:text-gray-300">
        <style>{`
          .prose h1 { margin-top: 0; font-size: 2em; border-bottom: 1px solid var(--tw-prose-hr); padding-bottom: 0.3em; margin-bottom: 16px; }
          .prose h2 { font-size: 1.5em; border-bottom: 1px solid var(--tw-prose-hr); padding-bottom: 0.3em; margin-top: 24px; margin-bottom: 16px; }
          .prose h3 { font-size: 1.25em; margin-top: 24px; margin-bottom: 16px; }
          .prose p { margin-top: 0; margin-bottom: 16px; }
          .prose ul, .prose ol { margin-top: 0; margin-bottom: 16px; padding-left: 2em; }
          .prose li { margin-top: 0.25em; margin-bottom: 0.25em; }
          .prose blockquote { border-left: 4px solid var(--tw-prose-quote-borders); color: var(--tw-prose-quotes); padding-left: 1em; font-style: normal; margin-left: 0; margin-right: 0; }
          .prose img { max-width: 100%; border-radius: 6px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
          .prose table { border-collapse: collapse; width: 100%; margin-bottom: 16px; }
          .prose th, .prose td { border: 1px solid var(--tw-prose-td-borders); padding: 6px 13px; }
          .prose tr:nth-child(2n) { background-color: var(--tw-prose-th-borders); }
          .mermaid { margin: 20px 0; padding: 20px; background-color: transparent; border-radius: 8px; }
        `}</style>
        <Markdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ node, inline, className, children, ...props }: any) {
              const match = /language-(\w+)/.exec(className || '')
              const language = match ? match[1] : ''

              // Render mermaid diagrams
              if (language === 'mermaid' && !inline) {
                return (
                  <div className="mermaid" key={Math.random()}>
                    {String(children).replace(/\n$/, '')}
                  </div>
                )
              }

              // Regular code blocks
              return !inline && match ? (
                <SyntaxHighlighter {...props} style={vscDarkPlus} language={language} PreTag="div">
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code {...props} className={className}>
                  {children}
                </code>
              )
            }
          }}
        >
          {content}
        </Markdown>
      </div>
    </div>
  )
}
