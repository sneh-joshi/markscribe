// Initialize marked.js with options
marked.setOptions({
  highlight: function (code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value
      } catch (err) {
        console.error(err)
      }
    }
    return hljs.highlightAuto(code).value
  },
  breaks: true,
  gfm: true
})

// DOM Elements
const editor = document.getElementById('editor')
const preview = document.getElementById('preview')
const darkModeToggle = document.getElementById('darkModeToggle')
const exportBtn = document.getElementById('exportBtn')
const exportModal = document.getElementById('exportModal')
const closeModal = document.getElementById('closeModal')
const viewBtns = document.querySelectorAll('.view-btn')
const wordCount = document.getElementById('wordCount')
const charCount = document.getElementById('charCount')
const lineCount = document.getElementById('lineCount')
const saveStatus = document.getElementById('saveStatus')

// State
let currentViewMode = 'split'
let saveTimeout = null

// Load saved content from localStorage
function loadSavedContent() {
  const saved = localStorage.getItem('markscribe-demo-content')
  if (saved) {
    editor.value = saved
  }
  updatePreview()
  updateStats()
}

// Save content to localStorage
function saveContent() {
  localStorage.setItem('markscribe-demo-content', editor.value)
  saveStatus.textContent = 'Saved'
  setTimeout(() => {
    saveStatus.textContent = 'Auto-saved'
  }, 2000)
}

// Auto-save with debounce
function autoSave() {
  clearTimeout(saveTimeout)
  saveStatus.textContent = 'Saving...'
  saveTimeout = setTimeout(saveContent, 1000)
}

// Update preview
function updatePreview() {
  const markdown = editor.value
  const html = marked.parse(markdown)
  preview.innerHTML = html

  // Re-highlight code blocks
  preview.querySelectorAll('pre code').forEach((block) => {
    hljs.highlightElement(block)
  })
}

// Update statistics
function updateStats() {
  const text = editor.value
  const words = text.trim().split(/\s+/).filter((word) => word.length > 0).length
  const chars = text.length
  const lines = text.split('\n').length

  wordCount.textContent = `${words} word${words !== 1 ? 's' : ''}`
  charCount.textContent = `${chars} character${chars !== 1 ? 's' : ''}`
  lineCount.textContent = `${lines} line${lines !== 1 ? 's' : ''}`
}

// Toggle dark mode
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode')
  const isDark = document.body.classList.contains('dark-mode')
  localStorage.setItem('markscribe-demo-dark-mode', isDark)
}

// Load dark mode preference
function loadDarkModePreference() {
  const isDark = localStorage.getItem('markscribe-demo-dark-mode') === 'true'
  if (isDark) {
    document.body.classList.add('dark-mode')
  }
}

// Change view mode
function changeViewMode(mode) {
  currentViewMode = mode

  // Update button states
  viewBtns.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.mode === mode)
  })

  // Update body class
  document.body.className = document.body.classList.contains('dark-mode') ? 'dark-mode' : ''
  if (mode !== 'split') {
    document.body.classList.add(`view-${mode}`)
  }
}

// Export functions
function exportAsMarkdown() {
  const content = editor.value
  const blob = new Blob([content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'document.md'
  a.click()
  URL.revokeObjectURL(url)
  closeExportModal()
}

function exportAsHTML() {
  const markdown = editor.value
  const html = marked.parse(markdown)
  const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Exported Document</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
      max-width: 800px;
      margin: 2rem auto;
      padding: 0 1rem;
      line-height: 1.6;
      color: #1f2937;
    }
    h1, h2 { border-bottom: 1px solid #e5e7eb; padding-bottom: 0.3em; }
    code { background: #f3f4f6; padding: 0.2em 0.4em; border-radius: 0.25rem; font-size: 0.875em; }
    pre { background: #f3f4f6; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; }
    pre code { background: none; padding: 0; }
    blockquote { border-left: 4px solid #3b82f6; padding-left: 1rem; color: #6b7280; }
    a { color: #3b82f6; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
${html}
</body>
</html>`

  const blob = new Blob([fullHTML], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'document.html'
  a.click()
  URL.revokeObjectURL(url)
  closeExportModal()
}

function exportAsPrint() {
  // Get the rendered HTML from the preview
  const previewContent = preview.innerHTML
  
  // Create a new window with just the preview content
  const printWindow = window.open('', '_blank', 'width=800,height=600')
  
  printWindow.document.write(`
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Print Preview - MarkScribe</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }
    
    h1, h2, h3, h4, h5, h6 {
      margin-top: 1.5em;
      margin-bottom: 0.5em;
      font-weight: 600;
    }
    
    h1 { font-size: 2em; border-bottom: 2px solid #eee; padding-bottom: 0.3em; }
    h2 { font-size: 1.5em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
    h3 { font-size: 1.25em; }
    
    code {
      background: #f6f8fa;
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 0.9em;
    }
    
    pre {
      background: #f6f8fa;
      padding: 1em;
      border-radius: 6px;
      overflow-x: auto;
    }
    
    pre code {
      background: none;
      padding: 0;
    }
    
    blockquote {
      border-left: 4px solid #ddd;
      padding-left: 1em;
      margin-left: 0;
      color: #666;
    }
    
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1em 0;
    }
    
    table th,
    table td {
      border: 1px solid #ddd;
      padding: 0.5em;
      text-align: left;
    }
    
    table th {
      background: #f6f8fa;
      font-weight: 600;
    }
    
    img {
      max-width: 100%;
      height: auto;
    }
    
    a {
      color: #0366d6;
      text-decoration: none;
    }
    
    a:hover {
      text-decoration: underline;
    }
    
    @media print {
      body {
        padding: 0;
      }
      
      @page {
        margin: 0.5in;
      }
      
      .print-tip {
        display: none !important;
      }
    }
    
    @page {
      size: auto;
      margin: 0.5in;
    }
  </style>
</head>
<body>
<div class="print-tip" style="background: #fff3cd; border: 1px solid #ffc107; padding: 1rem; margin-bottom: 2rem; border-radius: 6px; page-break-inside: avoid;">
  <strong>📄 Print Tip:</strong> For a cleaner PDF without headers/footers:
  <ul style="margin: 0.5rem 0 0 1.5rem; padding: 0;">
    <li><strong>Chrome/Edge:</strong> In print dialog, toggle off "Headers and footers"</li>
    <li><strong>Safari:</strong> Uncheck "Print headers and footers" in print dialog</li>
    <li><strong>Firefox:</strong> In print settings, set Headers & Footers to "Blank"</li>
  </ul>
  <small style="color: #856404; display: block; margin-top: 0.5rem;">This message will not appear in the printed document.</small>
</div>
${previewContent}
</body>
</html>
  `)
  
  printWindow.document.close()
  
  // Wait for content to load, then trigger print dialog
  printWindow.onload = function() {
    printWindow.focus()
    printWindow.print()
    // Close the window after printing (user can cancel)
    printWindow.onafterprint = function() {
      printWindow.close()
    }
  }
  
  closeExportModal()
}

// Modal functions
function openExportModal() {
  exportModal.classList.add('active')
}

function closeExportModal() {
  exportModal.classList.remove('active')
}

// Event Listeners
editor.addEventListener('input', () => {
  updatePreview()
  updateStats()
  autoSave()
})

darkModeToggle.addEventListener('click', toggleDarkMode)

exportBtn.addEventListener('click', openExportModal)
closeModal.addEventListener('click', closeExportModal)

exportModal.addEventListener('click', (e) => {
  if (e.target === exportModal) {
    closeExportModal()
  }
})

document.getElementById('exportMarkdown').addEventListener('click', exportAsMarkdown)
document.getElementById('exportHTML').addEventListener('click', exportAsHTML)
document.getElementById('exportPrint').addEventListener('click', exportAsPrint)

viewBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    changeViewMode(btn.dataset.mode)
  })
})

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Cmd/Ctrl + S to save
  if ((e.metaKey || e.ctrlKey) && e.key === 's') {
    e.preventDefault()
    saveContent()
  }

  // Cmd/Ctrl + E to toggle export modal
  if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
    e.preventDefault()
    openExportModal()
  }

  // ESC to close modal
  if (e.key === 'Escape') {
    closeExportModal()
  }
})

// Initialize
loadDarkModePreference()
loadSavedContent()

// Auto-save every 30 seconds
setInterval(saveContent, 30000)
