import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  openFile: (): Promise<{ filePath: string; content: string } | null> =>
    ipcRenderer.invoke('open-file'),
  saveFile: (filePath: string, content: string): Promise<void> =>
    ipcRenderer.invoke('save-file', filePath, content),
  saveFileAs: (content: string): Promise<string | null> =>
    ipcRenderer.invoke('save-file-as', content),
  exportToPDF: (
    htmlContent: string
  ): Promise<{ success: boolean; filePath?: string; message?: string }> =>
    ipcRenderer.invoke('exportToPDF', htmlContent),
  loadFileByPath: (filePath: string): Promise<{ filePath: string; content: string } | null> =>
    ipcRenderer.invoke('load-file-by-path', filePath),
  exportToHTML: (content: string): Promise<string | null> =>
    ipcRenderer.invoke('export-html', content),
  exportToDOCX: (content: string): Promise<string | null> =>
    ipcRenderer.invoke('export-docx', content),

  // AI (Ollama) via IPC to avoid renderer CORS issues in production (file:// origin)
  ollamaTags: (endpoint: string): Promise<any> => ipcRenderer.invoke('ollama-tags', endpoint),
  ollamaGenerate: (endpoint: string, payload: any): Promise<any> =>
    ipcRenderer.invoke('ollama-generate', endpoint, payload)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
