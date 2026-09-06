import { BrowserWindow } from "electron";
import path from "node:path";
import { loadRendererPage } from "./windowUrl";

let win: BrowserWindow | null = null;

export function openSettingsWindow(): void {
  if (win && !win.isDestroyed()) {
    win.focus();
    return;
  }

  win = new BrowserWindow({
    width: 500,
    height: 760,
    resizable: true,
    minHeight: 420,
    title: "Impostazioni — Batuffolina",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "../preload/preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  loadRendererPage(win, "settings.html");

  win.on("closed", () => {
    win = null;
  });
}
