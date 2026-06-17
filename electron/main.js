import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, dialog } from 'electron';
import path from 'path';
import { autoUpdater } from 'electron-updater';
import { getDatabase, closeDatabase } from './db/connection.js';
import { registerVehicleHandlers } from './db/vehicles.js';
import { registerDriverHandlers } from './db/drivers.js';
import { registerTripHandlers } from './db/trips.js';
import { registerFuelHandlers } from './db/fuel.js';
import { registerMaintenanceHandlers } from './db/maintenance.js';
import { registerAssignmentHandlers } from './db/assignments.js';
import { registerDashboardHandlers } from './db/dashboard.js';
import { registerAuditHandlers } from './db/audit.js';
import { registerDispatchHandlers } from './db/dispatches.js';
import { registerTrackingHandlers } from './db/tracking.js';
import { registerGeofenceHandlers } from './db/geofences.js';
import { registerAlertHandlers } from './db/alerts.js';
import { registerIncidentHandlers } from './db/incidents.js';
import { registerSparePartHandlers } from './db/spare_parts.js';
import { registerDocumentHandlers } from './db/documents.js';
import { registerSettingHandlers } from './db/settings.js';
import { registerUserHandlers } from './db/users.js';
import { seedDatabase } from './db/seed.js';

const isDev = process.env.NODE_ENV !== 'production' || !app.isPackaged;

let mainWindow = null;
let tray = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'FleetOps Manager',
    webPreferences: {
      preload: path.join(app.getAppPath(), 'electron', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    icon: path.join(app.getAppPath(), 'public', 'icon.png'),
    show: false,
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('close', (event) => {
    if (tray && !app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function createAppMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        { label: 'New Window', accelerator: 'CmdOrCtrl+N', click: () => createWindow() },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
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
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About FleetOps Manager',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About FleetOps Manager',
              message: 'FleetOps Manager v' + app.getVersion(),
              detail: 'Offline Fleet Management System\nBuilt with Electron, React, and SQLite.',
            });
          },
        },
      ],
    },
  ];

  if (process.platform === 'darwin') {
    template.unshift({
      label: app.getName(),
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    });
  }

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createTray() {
  const icon = nativeImage.createFromPath(
    path.join(app.getAppPath(), 'public', 'icon.png')
  );
  tray = new Tray(icon.resize({ width: 16, height: 16 }));
  tray.setToolTip('FleetOps Manager');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show FleetOps',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

function setupAutoUpdater() {
  if (isDev) return;
  autoUpdater.logger = console;
  autoUpdater.checkForUpdatesAndNotify();
  setInterval(() => autoUpdater.checkForUpdatesAndNotify(), 3600000);
}

app.isQuitting = false;

app.whenReady().then(() => {
  const db = getDatabase();

  registerVehicleHandlers(db, ipcMain);
  registerDriverHandlers(db, ipcMain);
  registerTripHandlers(db, ipcMain);
  registerFuelHandlers(db, ipcMain);
  registerMaintenanceHandlers(db, ipcMain);
  registerAssignmentHandlers(db, ipcMain);
  registerDashboardHandlers(db, ipcMain);
  registerAuditHandlers(db, ipcMain);
  registerDispatchHandlers(db, ipcMain);
  registerTrackingHandlers(db, ipcMain);
  registerGeofenceHandlers(db, ipcMain);
  registerAlertHandlers(db, ipcMain);
  registerIncidentHandlers(db, ipcMain);
  registerSparePartHandlers(db, ipcMain);
  registerDocumentHandlers(db, ipcMain);
  registerSettingHandlers(db, ipcMain);
  registerUserHandlers(db, ipcMain);
  seedDatabase(db);

  createAppMenu();
  createTray();
  createWindow();
  setupAutoUpdater();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  closeDatabase();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  app.isQuitting = true;
  closeDatabase();
});
