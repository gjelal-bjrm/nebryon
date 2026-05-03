const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  /** Open a native folder picker — returns the absolute path or null if cancelled */
  pickDir: () => ipcRenderer.invoke('orbit:pick-dir'),

  /** Write content to dir/filename on disk */
  writeFile: (dir, filename, content) =>
    ipcRenderer.invoke('orbit:write-file', { dir, filename, content }),

  /** Register a callback for the before-quit signal from main.
   *  Clears any previously registered listener first to avoid duplicates
   *  (e.g. React StrictMode double-invoke, HMR). */
  onBeforeQuit: (cb) => {
    ipcRenderer.removeAllListeners('orbit:before-quit');
    ipcRenderer.on('orbit:before-quit', cb);
  },

  /** Tell main the renderer is ready to quit (after backup is done) */
  quitReady: () => ipcRenderer.invoke('orbit:quit-ready'),
});
