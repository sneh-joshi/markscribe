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
  window.print()
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
