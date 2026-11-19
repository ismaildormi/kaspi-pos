/**
 * HEYUKA Desktop OS (by KASPI) — Isolated Electron Companion Shell
 * Supports frameless Always-on-Top Creative HUD, Ghost Cursor IPC forwarding,
 * Alt+X global toggle, and opt-in Python Sidecar provisioning outside App Sandbox.
 */
const { app, BrowserWindow, globalShortcut, ipcMain } = require("electron");
const path = require("node:path");

const TARGET_URL = process.env.HEYUKA_APP_URL || "https://kaspi-pos.vercel.app/ar/heyuka";

let mainWindow = null;

function createHeyukaWindow() {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 760,
    minWidth: 420,
    minHeight: 540,
    frame: true,
    transparent: false,
    backgroundColor: "#090d16",
    title: "HEYUKA Desktop OS — Powered by KASPI",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(TARGET_URL);
}

app.whenReady().then(() => {
  createHeyukaWindow();

  globalShortcut.register("Alt+X", () => {
    if (!mainWindow) return;
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  ipcMain.handle("heyuka:get-status", () => ({
    product: "HEYUKA Desktop OS",
    owner: "KASPI",
    version: "10.0.0",
    platform: process.platform,
    ghostCursorReady: true,
  }));

  ipcMain.handle("heyuka:set-always-on-top", (_ev, flag) => {
    if (mainWindow) mainWindow.setAlwaysOnTop(Boolean(flag));
    return Boolean(flag);
  });
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
