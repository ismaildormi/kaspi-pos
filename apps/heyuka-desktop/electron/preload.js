const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("heyukaDesktop", {
  getStatus: () => ipcRenderer.invoke("heyuka:get-status"),
  setAlwaysOnTop: (enabled) => ipcRenderer.invoke("heyuka:set-always-on-top", enabled),
  onGhostCursorMove: (cb) => {
    const handler = (_event, coords) => cb(coords);
    ipcRenderer.on("heyuka:ghost-cursor-move", handler);
    return () => ipcRenderer.removeListener("heyuka:ghost-cursor-move", handler);
  },
});
