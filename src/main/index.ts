import { app, shell, BrowserWindow, ipcMain, dialog, Menu } from 'electron'
import { join } from 'path'
import { readFile, writeFile } from 'fs/promises'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    title: 'MarkScribe',
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Create native menu
  const isMac = process.platform === 'darwin'

  const template: Electron.MenuItemConstructorOptions[] = [
    // macOS app menu
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: 'about' as const },
              { type: 'separator' as const },
              { role: 'hide' as const },
              { role: 'hideOthers' as const },
              { role: 'unhide' as const },
              { type: 'separator' as const },
              { role: 'quit' as const }
            ]
          }
        ]
      : []),
    {
      label: 'File',
      submenu: [
        {
          label: 'Open File...',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow?.webContents.send('menu-open-file')
          }
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow?.webContents.send('menu-save-file')
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit()
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// Export to PDF handler
ipcMain.handle('exportToPDF', async (_, htmlContent: string) => {
  try {
    const { filePath } = await dialog.showSaveDialog({
      title: 'Export to PDF',
      defaultPath: 'document.pdf',
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
    })

    if (!filePath) {
      return { success: false, message: 'Export cancelled' }
    }

    // Create a hidden window to render the HTML
    const pdfWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false
      }
    })

    // Load the HTML content
    await pdfWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`)

    // Generate PDF
    const pdfData = await pdfWindow.webContents.printToPDF({
      printBackground: true,
      margins: {
        top: 0.5,
        bottom: 0.5,
        left: 0.5,
        right: 0.5
      }
    })

    // Write to file
    await writeFile(filePath, pdfData)

    // Close the hidden window
    pdfWindow.close()

    return { success: true, filePath }
  } catch (error) {
    console.error('PDF export error:', error)
    return { success: false, message: error instanceof Error ? error.message : 'Unknown error' }
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => {
    // Ping received
  })

  ipcMain.handle('open-file', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }]
    })
    if (canceled) {
      return null
    } else {
      const content = await readFile(filePaths[0], 'utf-8')
      return { filePath: filePaths[0], content }
    }
  })

  ipcMain.handle('save-file-as', async (_, content: string) => {
    const { canceled, filePath } = await dialog.showSaveDialog({
      filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }]
    })
    if (canceled || !filePath) {
      return null
    }
    await writeFile(filePath, content, 'utf-8')
    return filePath
  })

  ipcMain.handle('save-file', async (_, filePath: string, content: string) => {
    if (filePath) {
      await writeFile(filePath, content, 'utf-8')
      return { filePath }
    } else {
      const { canceled, filePath: savePath } = await dialog.showSaveDialog({
        filters: [{ name: 'Markdown', extensions: ['md', 'markdown'] }]
      })
      if (canceled || !savePath) return null
      await writeFile(savePath, content, 'utf-8')
      return { filePath: savePath }
    }
  })

  ipcMain.handle('load-file-by-path', async (_, filePath: string) => {
    try {
      const content = await readFile(filePath, 'utf-8')
      return { filePath, content }
    } catch (error) {
      console.error('Error loading file:', error)
      return null
    }
  })

  // Export to HTML
  ipcMain.handle('export-html', async (_, content: string) => {
    const MarkdownIt = (await import('markdown-it')).default
    const md = new MarkdownIt()
    const htmlContent = md.render(content)

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Exported Document</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            color: #333;
        }
        h1, h2, h3, h4, h5, h6 {
            margin-top: 1.5em;
            margin-bottom: 0.5em;
            font-weight: 600;
        }
        code {
            background: #f4f4f4;
            padding: 0.2em 0.4em;
            border-radius: 3px;
            font-family: 'Monaco', 'Courier New', monospace;
        }
        pre {
            background: #f4f4f4;
            padding: 1em;
            border-radius: 5px;
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
        a {
            color: #0066cc;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
        img {
            max-width: 100%;
            height: auto;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 1em 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 0.5em;
            text-align: left;
        }
        th {
            background: #f4f4f4;
            font-weight: 600;
        }
    </style>
</head>
<body>
${htmlContent}
</body>
</html>`

    const { canceled, filePath } = await dialog.showSaveDialog({
      filters: [{ name: 'HTML', extensions: ['html'] }],
      defaultPath: 'document.html'
    })

    if (canceled || !filePath) return null
    await writeFile(filePath, fullHtml, 'utf-8')
    return filePath
  })

  // Export to DOCX
  ipcMain.handle('export-docx', async (_, content: string) => {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx')

    // Simple markdown to docx conversion
    const lines = content.split('\n')
    const paragraphs: any[] = []

    for (const line of lines) {
      if (line.startsWith('# ')) {
        paragraphs.push(
          new Paragraph({
            text: line.substring(2),
            heading: HeadingLevel.HEADING_1
          })
        )
      } else if (line.startsWith('## ')) {
        paragraphs.push(
          new Paragraph({
            text: line.substring(3),
            heading: HeadingLevel.HEADING_2
          })
        )
      } else if (line.startsWith('### ')) {
        paragraphs.push(
          new Paragraph({
            text: line.substring(4),
            heading: HeadingLevel.HEADING_3
          })
        )
      } else if (line.trim() === '') {
        paragraphs.push(new Paragraph({ text: '' }))
      } else {
        // Handle bold and italic (simple implementation)
        const children: any[] = []
        const parts = line.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/)

        for (const part of parts) {
          if (part.startsWith('**') && part.endsWith('**')) {
            children.push(new TextRun({ text: part.slice(2, -2), bold: true }))
          } else if (part.startsWith('*') && part.endsWith('*')) {
            children.push(new TextRun({ text: part.slice(1, -1), italics: true }))
          } else if (part.startsWith('`') && part.endsWith('`')) {
            children.push(new TextRun({ text: part.slice(1, -1), font: 'Courier New' }))
          } else if (part) {
            children.push(new TextRun({ text: part }))
          }
        }

        paragraphs.push(new Paragraph({ children }))
      }
    }

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: paragraphs
        }
      ]
    })

    const { canceled, filePath } = await dialog.showSaveDialog({
      filters: [{ name: 'Word Document', extensions: ['docx'] }],
      defaultPath: 'document.docx'
    })

    if (canceled || !filePath) return null

    const buffer = await Packer.toBuffer(doc)
    await writeFile(filePath, buffer)
    return filePath
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
