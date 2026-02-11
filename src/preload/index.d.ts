import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      openFile: () => Promise<{ filePath: string; content: string } | null>
      saveFile: (filePath: string, content: string) => Promise<{ filePath: string } | null>
      exportToPDF: (
        htmlContent: string
      ) => Promise<{ success: boolean; filePath?: string; message?: string }>
      loadFileByPath: (filePath: string) => Promise<{ filePath: string; content: string } | null>
      exportToHTML: (content: string) => Promise<string | null>
      exportToDOCX: (content: string) => Promise<string | null>
    }
  }
}
