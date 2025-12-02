import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        frame: false, // Disable native frame
        titleBarStyle: 'hidden', // Hide native title bar
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false, // For simpler local dev, can be hardened later
        },
    });

    // In production, load the index.html file
    // In development, load the Vite dev server URL
    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:5173');
        // Open DevTools only if specifically requested or in debug mode
        // mainWindow.webContents.openDevTools(); 
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(async () => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });

    // Check for updates
    if (process.env.NODE_ENV !== 'development') {
        const { autoUpdater } = await import('electron-updater');
        const log = await import('electron-log');

        log.transports.file.level = 'info';
        autoUpdater.logger = log;

        // Update events
        autoUpdater.on('update-available', () => {
            mainWindow?.webContents.send('update-available');
        });

        autoUpdater.on('update-downloaded', () => {
            mainWindow?.webContents.send('update-downloaded');
        });

        autoUpdater.checkForUpdatesAndNotify();
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// IPC Handlers
ipcMain.handle('ping', () => 'pong');

// Window Control Handlers
ipcMain.handle('window-minimize', () => {
    mainWindow?.minimize();
});

ipcMain.handle('window-maximize', () => {
    if (mainWindow?.isMaximized()) {
        mainWindow?.unmaximize();
    } else {
        mainWindow?.maximize();
    }
});

ipcMain.handle('window-close', () => {
    mainWindow?.close();
});

ipcMain.handle('export-to-word', async (event, htmlContent) => {
    const { dialog } = await import('electron');
    const fs = await import('fs/promises');
    const HTMLtoDOCX = (await import('html-to-docx')).default;

    const { filePath } = await dialog.showSaveDialog(mainWindow, {
        title: 'Save as Word Document',
        defaultPath: 'lesson-material.docx',
        filters: [{ name: 'Word Document', extensions: ['docx'] }]
    });

    if (filePath) {
        try {
            const fileBuffer = await HTMLtoDOCX(htmlContent, null, {
                table: { row: { cantSplit: true } },
                footer: true,
                pageNumber: true,
            });
            await fs.writeFile(filePath, fileBuffer);
            return { success: true, filePath };
        } catch (error) {
            console.error('Export failed:', error);
            return { success: false, error: error.message };
        }
    }
    return { canceled: true };
});

ipcMain.handle('export-to-pdf', async (event, htmlContent) => {
    const { dialog } = await import('electron');
    const fs = await import('fs/promises');

    const { filePath } = await dialog.showSaveDialog(mainWindow, {
        title: 'Save as PDF',
        defaultPath: 'lesson-material.pdf',
        filters: [{ name: 'PDF Document', extensions: ['pdf'] }]
    });

    if (filePath) {
        try {
            // Create a hidden window to render the content
            const printWindow = new BrowserWindow({
                show: false,
                webPreferences: { nodeIntegration: true }
            });

            // Wrap content in a basic HTML structure with Tailwind CDN for styling
            // Note: In a real app, we'd want to inject the actual local CSS
            const html = `
                <html>
                <head>
                    <script src="https://cdn.tailwindcss.com"></script>
                    <style>
                        body { padding: 40px; font-family: sans-serif; }
                        h1 { font-size: 2em; font-weight: bold; margin-bottom: 0.5em; }
                        h2 { font-size: 1.5em; font-weight: bold; margin-bottom: 0.5em; }
                        ul { list-style-type: disc; margin-left: 1.5em; margin-bottom: 1em; }
                        ol { list-style-type: decimal; margin-left: 1.5em; margin-bottom: 1em; }
                        p { margin-bottom: 1em; }
                    </style>
                </head>
                <body>
                    <div class="prose max-w-none">
                        ${htmlContent}
                    </div>
                </body>
                </html>
            `;

            await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

            const pdfData = await printWindow.webContents.printToPDF({
                printBackground: true,
                pageSize: 'A4',
            });

            await fs.writeFile(filePath, pdfData);
            printWindow.close();

            return { success: true, filePath };
        } catch (error) {
            console.error('PDF Export failed:', error);
            return { success: false, error: error.message };
        }
    }
    return { canceled: true };
});

// Workspace Persistence Handlers
ipcMain.handle('save-workspace', async (event, workspace) => {
    const fs = await import('fs/promises');
    const path = await import('path');

    try {
        const documentsPath = app.getPath('documents');
        const appDir = path.join(documentsPath, 'SaberScribeWorkspaces');

        // Ensure directory exists
        try {
            await fs.access(appDir);
        } catch {
            await fs.mkdir(appDir, { recursive: true });
        }

        const filePath = path.join(appDir, `${workspace.id}.json`);
        await fs.writeFile(filePath, JSON.stringify(workspace, null, 2));

        return { success: true, filePath };
    } catch (error) {
        console.error('Failed to save workspace:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('load-workspaces', async () => {
    const fs = await import('fs/promises');
    const path = await import('path');

    try {
        const documentsPath = app.getPath('documents');
        const appDir = path.join(documentsPath, 'SaberScribeWorkspaces');

        try {
            await fs.access(appDir);
        } catch {
            return { success: true, workspaces: [] };
        }

        const files = await fs.readdir(appDir);
        const jsonFiles = files.filter(file => file.endsWith('.json'));

        const workspaces = await Promise.all(jsonFiles.map(async (file) => {
            const content = await fs.readFile(path.join(appDir, file), 'utf-8');
            return JSON.parse(content);
        }));

        // Sort by lastModified descending
        workspaces.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));

        return { success: true, workspaces };
    } catch (error) {
        console.error('Failed to load workspaces:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('delete-workspace', async (event, id) => {
    const fs = await import('fs/promises');
    const path = await import('path');

    try {
        const documentsPath = app.getPath('documents');
        const filePath = path.join(documentsPath, 'SaberScribeWorkspaces', `${id}.json`);

        await fs.unlink(filePath);
        return { success: true };
    } catch (error) {
        console.error('Failed to delete workspace:', error);
        return { success: false, error: error.message };
    }
});

ipcMain.handle('restart-app', () => {
    const { autoUpdater } = require('electron-updater');
    autoUpdater.quitAndInstall();
});
