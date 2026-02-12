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
const editorGhost = document.getElementById('editorGhost')
const preview = document.getElementById('preview')
const darkModeToggle = document.getElementById('darkModeToggle')
const exportBtn = document.getElementById('exportBtn')
const exportModal = document.getElementById('exportModal')
const closeModal = document.getElementById('closeModal')
const aiConnectBtn = document.getElementById('aiConnectBtn')
const aiStatusBadge = document.getElementById('aiStatusBadge')
const aiModal = document.getElementById('aiModal')
const closeAIModal = document.getElementById('closeAIModal')
const ollamaEndpointInput = document.getElementById('ollamaEndpoint')
const ollamaModelInput = document.getElementById('ollamaModel')
const testAIConnectionBtn = document.getElementById('testAIConnection')
const saveAISettingsBtn = document.getElementById('saveAISettings')
const aiConnectionMessage = document.getElementById('aiConnectionMessage')
const viewBtns = document.querySelectorAll('.view-btn')
const wordCount = document.getElementById('wordCount')
const charCount = document.getElementById('charCount')
const lineCount = document.getElementById('lineCount')
const saveStatus = document.getElementById('saveStatus')

// State
let currentViewMode = 'split'
let saveTimeout = null
let suggestionTimeout = null
let aiSuggestion = ''
let activeSuggestionRequestId = 0
let aiConfig = {
  enabled: false,
  endpoint: 'http://127.0.0.1:11434',
  model: 'llama3.2:latest'
}

const SUGGESTION_DEBOUNCE_MS = 900
const MAX_SUGGESTION_CHARS = 120

function normalizeText(value) {
  return (value || '').replace(/\s+/g, ' ').trim().toLowerCase()
}

function getMockSuggestion(before, after) {
  const trimmedBefore = before.trimEnd()
  const lastLine = trimmedBefore.split('\n').pop()?.trim() || ''

  if (lastLine.startsWith('### ')) return 'This section explains the practical impact and trade-offs in simple terms.'
  if (lastLine.startsWith('- ')) return 'Add measurable outcomes so the point is easier to evaluate.'
  if (lastLine.startsWith('> ')) return 'This perspective is useful, but should be validated with real examples.'
  if (after.trimStart().startsWith('- ')) return '- Include one concrete data point to support this claim.'

  return 'This improves clarity and keeps the narrative focused on actionable outcomes.'
}

function sanitizeSuggestion(raw) {
  const firstLine = (raw || '').replace(/\r\n/g, '\n').split('\n')[0]?.trim() || ''
  if (!firstLine) return ''

  const compact = firstLine.replace(/\s+/g, ' ').trim()
  if (!compact) return ''

  if (compact.length <= MAX_SUGGESTION_CHARS) return compact
  const clipped = compact.slice(0, MAX_SUGGESTION_CHARS)
  const lastSpace = clipped.lastIndexOf(' ')
  return (lastSpace > 24 ? clipped.slice(0, lastSpace) : clipped).trimEnd()
}

function trimRightOverlap(suggestion, rightContext) {
  const text = suggestion || ''
  const right = (rightContext || '').trimStart()
  if (!text || !right) return text
  if (normalizeText(right).startsWith(normalizeText(text))) return ''
  return text
}

function clearSuggestion() {
  aiSuggestion = ''
  editorGhost.innerHTML = ''
}

function getCaretCoordinates(textarea, position) {
  const div = document.createElement('div')
  const computed = window.getComputedStyle(textarea)

  div.style.whiteSpace = 'pre-wrap'
  div.style.wordWrap = 'break-word'
  div.style.position = 'absolute'
  div.style.visibility = 'hidden'
  div.style.pointerEvents = 'none'
  div.style.top = '0'
  div.style.left = '0'

  div.style.fontFamily = computed.fontFamily
  div.style.fontSize = computed.fontSize
  div.style.fontWeight = computed.fontWeight
  div.style.lineHeight = computed.lineHeight
  div.style.padding = computed.padding
  div.style.border = computed.border
  div.style.boxSizing = computed.boxSizing
  div.style.width = `${textarea.clientWidth}px`

  div.textContent = textarea.value.slice(0, Math.max(0, position))

  const marker = document.createElement('span')
  marker.textContent = '\u200b'
  div.appendChild(marker)

  document.body.appendChild(div)
  const coords = { left: marker.offsetLeft, top: marker.offsetTop }
  document.body.removeChild(div)

  return coords
}

function renderSuggestionOverlay() {
  editorGhost.innerHTML = ''

  if (!aiSuggestion) return
  if (document.activeElement !== editor) return

  const start = editor.selectionStart || 0
  const end = editor.selectionEnd || start
  if (start !== end) return

  const immediateRight = editor.value[start] || ''
  if (immediateRight && immediateRight !== '\n') return

  const coords = getCaretCoordinates(editor, end)
  const textEl = document.createElement('span')
  textEl.className = 'editor-ghost-text'
  textEl.textContent = aiSuggestion
  textEl.style.left = `${coords.left - editor.scrollLeft}px`
  textEl.style.top = `${coords.top - editor.scrollTop}px`
  textEl.style.maxWidth = `${Math.max(0, editor.clientWidth - coords.left - 12)}px`
  editorGhost.appendChild(textEl)
}

async function fetchOllamaSuggestion(before, after) {
  const endpoint = getNormalizedEndpoint(aiConfig.endpoint)
  const model = (aiConfig.model || '').trim()

  if (!endpoint || !model) return ''

  const prompt = `You are an AI writing assistant for Markdown.
Output only short text to insert at cursor.
Rules:
- Single line only.
- Keep same tone/style.
- Do not repeat left or right context.

Left context:\n${before}\n\nRight context:\n${after}\n\nInsertion:`

  const response = await fetch(`${endpoint}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: {
        temperature: 0.45,
        num_predict: 64
      }
    })
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`)
  }

  const data = await response.json()
  return data?.response || ''
}

async function generateSuggestion() {
  const requestId = ++activeSuggestionRequestId
  const start = editor.selectionStart || 0
  const end = editor.selectionEnd || start

  if (start !== end) {
    clearSuggestion()
    return
  }

  const rightChar = editor.value[start] || ''
  if (rightChar && rightChar !== '\n') {
    clearSuggestion()
    return
  }

  const before = editor.value.slice(Math.max(0, start - 1500), start)
  const after = editor.value.slice(start, Math.min(editor.value.length, start + 600))

  let rawSuggestion = ''
  if (aiConfig.enabled) {
    try {
      rawSuggestion = await fetchOllamaSuggestion(before, after)
    } catch {
      rawSuggestion = getMockSuggestion(before, after)
    }
  } else {
    rawSuggestion = getMockSuggestion(before, after)
  }

  if (activeSuggestionRequestId !== requestId) return

  const cleaned = sanitizeSuggestion(trimRightOverlap(rawSuggestion, after))
  if (!cleaned) {
    clearSuggestion()
    return
  }

  const normalizedBefore = normalizeText(before)
  const normalizedAfter = normalizeText(after)
  const normalizedSuggestion = normalizeText(cleaned)
  if (
    !normalizedSuggestion ||
    normalizedBefore.endsWith(normalizedSuggestion) ||
    normalizedAfter.startsWith(normalizedSuggestion)
  ) {
    clearSuggestion()
    return
  }

  aiSuggestion = cleaned
  renderSuggestionOverlay()
}

function scheduleSuggestion() {
  clearTimeout(suggestionTimeout)
  clearSuggestion()
  suggestionTimeout = setTimeout(() => {
    generateSuggestion()
  }, SUGGESTION_DEBOUNCE_MS)
}

function acceptSuggestion() {
  if (!aiSuggestion) return false
  const start = editor.selectionStart || 0
  const end = editor.selectionEnd || start
  const nextValue = editor.value.slice(0, start) + aiSuggestion + editor.value.slice(end)
  editor.value = nextValue
  const nextPos = start + aiSuggestion.length
  editor.selectionStart = nextPos
  editor.selectionEnd = nextPos

  clearSuggestion()
  updatePreview()
  updateStats()
  autoSave()
  scheduleSuggestion()
  return true
}

function getNormalizedEndpoint(url) {
  return (url || '').trim().replace(/\/+$/, '')
}

function setAIMessage(message, type) {
  aiConnectionMessage.textContent = message
  aiConnectionMessage.classList.remove('success', 'error')
  if (type) {
    aiConnectionMessage.classList.add(type)
  }
}

function updateAIBadge() {
  if (!aiConfig.enabled) {
    aiStatusBadge.textContent = 'AI: Mock'
    aiStatusBadge.classList.remove('connected')
    return
  }

  aiStatusBadge.textContent = `AI: ${aiConfig.model}`
  aiStatusBadge.classList.add('connected')
}

function loadAIConfig() {
  const saved = localStorage.getItem('markscribe-demo-ai-config')
  if (!saved) {
    updateAIBadge()
    return
  }

  try {
    const parsed = JSON.parse(saved)
    aiConfig = {
      enabled: Boolean(parsed.enabled),
      endpoint: getNormalizedEndpoint(parsed.endpoint) || 'http://127.0.0.1:11434',
      model: (parsed.model || 'llama3.2:latest').trim()
    }
  } catch {
    // ignore malformed local storage
  }

  ollamaEndpointInput.value = aiConfig.endpoint
  ollamaModelInput.value = aiConfig.model
  updateAIBadge()
}

function saveAIConfig(enabled) {
  aiConfig = {
    enabled,
    endpoint: getNormalizedEndpoint(ollamaEndpointInput.value) || 'http://127.0.0.1:11434',
    model: (ollamaModelInput.value || 'llama3.2:latest').trim()
  }

  ollamaEndpointInput.value = aiConfig.endpoint
  ollamaModelInput.value = aiConfig.model
  localStorage.setItem('markscribe-demo-ai-config', JSON.stringify(aiConfig))
  updateAIBadge()
}

async function testOllamaConnection() {
  const endpoint = getNormalizedEndpoint(ollamaEndpointInput.value)
  if (!endpoint) {
    setAIMessage('Please enter a valid endpoint URL.', 'error')
    return false
  }

  testAIConnectionBtn.disabled = true
  testAIConnectionBtn.textContent = 'Testing...'

  try {
    const response = await fetch(`${endpoint}/api/tags`, {
      method: 'GET'
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()
    const models = Array.isArray(data.models) ? data.models : []
    const currentModel = (ollamaModelInput.value || '').trim()
    const hasModel = currentModel
      ? models.some((item) => item?.name === currentModel)
      : false

    if (currentModel && !hasModel) {
      setAIMessage(
        `Connected to Ollama, but model "${currentModel}" was not found. Save anyway to use it later.`,
        'error'
      )
      return false
    }

    setAIMessage('Connected successfully. You can now save this endpoint.', 'success')
    return true
  } catch (error) {
    setAIMessage(
      `Connection failed (${error instanceof Error ? error.message : 'unknown error'}). If Ollama is running, this may be a browser CORS restriction.`,
      'error'
    )
    return false
  } finally {
    testAIConnectionBtn.disabled = false
    testAIConnectionBtn.textContent = 'Test Connection'
  }
}

function openAIModal() {
  ollamaEndpointInput.value = aiConfig.endpoint
  ollamaModelInput.value = aiConfig.model
  setAIMessage(
    aiConfig.enabled
      ? 'Using saved Ollama settings for this browser.'
      : 'Demo currently uses mock AI. Connect Ollama to try live endpoint settings.',
    undefined
  )
  aiModal.classList.add('active')
}

function closeAIModalFn() {
  aiModal.classList.remove('active')
}

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
  scheduleSuggestion()
})

editor.addEventListener('keyup', () => {
  renderSuggestionOverlay()
  scheduleSuggestion()
})

editor.addEventListener('click', () => {
  renderSuggestionOverlay()
  scheduleSuggestion()
})

editor.addEventListener('scroll', () => {
  renderSuggestionOverlay()
})

editor.addEventListener('blur', () => {
  clearSuggestion()
})

editor.addEventListener('focus', () => {
  renderSuggestionOverlay()
  scheduleSuggestion()
})

darkModeToggle.addEventListener('click', toggleDarkMode)

exportBtn.addEventListener('click', openExportModal)
closeModal.addEventListener('click', closeExportModal)
aiConnectBtn.addEventListener('click', openAIModal)
closeAIModal.addEventListener('click', closeAIModalFn)

testAIConnectionBtn.addEventListener('click', async () => {
  await testOllamaConnection()
})

saveAISettingsBtn.addEventListener('click', async () => {
  const ok = await testOllamaConnection()
  saveAIConfig(ok)
  if (ok) {
    setAIMessage('Saved. Demo is now configured for this Ollama endpoint in your browser.', 'success')
  }
})

exportModal.addEventListener('click', (e) => {
  if (e.target === exportModal) {
    closeExportModal()
  }
})

aiModal.addEventListener('click', (e) => {
  if (e.target === aiModal) {
    closeAIModalFn()
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
  if (e.key === 'Tab' && document.activeElement === editor && aiSuggestion) {
    e.preventDefault()
    if (acceptSuggestion()) return
  }

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
    closeAIModalFn()
    clearSuggestion()
  }
})

// Initialize
loadDarkModePreference()
loadAIConfig()
loadSavedContent()
scheduleSuggestion()

// Auto-save every 30 seconds
setInterval(saveContent, 30000)
