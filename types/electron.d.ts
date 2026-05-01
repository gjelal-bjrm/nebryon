/**
 * Type declarations for the Electron IPC bridge exposed via preload.js.
 * Available as `window.electronAPI` when running inside Electron.
 */
interface ElectronAPI {
  /** Opens native folder picker — returns absolute path or null if cancelled */
  pickDir: () => Promise<string | null>;
  /** Writes content to `dir/filename` on disk */
  writeFile: (dir: string, filename: string, content: string) => Promise<void>;
  /** Register a callback invoked when the app is about to quit */
  onBeforeQuit: (cb: () => void) => void;
  /** Signal to main process that renderer is ready to quit */
  quitReady: () => Promise<void>;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};
