import path from "node:path";
import { app, type BrowserWindow } from "electron";

export function isDev(): boolean {
  return !app.isPackaged;
}

/**
 * Loads one of the renderer's multi-page entry points (onboarding.html,
 * pet.html, settings.html) into a window, whether we're pointed at the
 * Vite dev server or reading the built files from disk.
 *
 * In dev mode `npm run dev` starts Electron and the Vite server
 * concurrently, so there's a real chance Electron asks for the page before
 * Vite is listening yet — hence the one-shot retry on failure.
 */
export function loadRendererPage(
  win: BrowserWindow,
  page: string,
  query: Record<string, string> = {},
): void {
  const attempt = (): Promise<void> => {
    if (isDev()) {
      const base = process.env.VITE_DEV_SERVER_URL ?? "http://localhost:5173";
      const qs = new URLSearchParams(query).toString();
      return win.loadURL(`${base}/${page}${qs ? `?${qs}` : ""}`);
    }
    const filePath = path.join(__dirname, "../renderer", page);
    return win.loadFile(filePath, { query });
  };

  attempt().catch(() => {
    setTimeout(() => {
      attempt().catch((error) => {
        console.error(`[batuffolina] failed to load ${page} after retry:`, error);
      });
    }, 500);
  });
}
