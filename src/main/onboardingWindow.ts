import { BrowserWindow } from "electron";
import path from "node:path";
import { loadRendererPage } from "./windowUrl";

let win: BrowserWindow | null = null;

export function openOnboardingWindow(): void {
  if (win && !win.isDestroyed()) {
    win.focus();
    return;
  }

  win = new BrowserWindow({
    width: 760,
    height: 680,
    resizable: false,
    title: "Aggiungi un Batuffolina",
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "../preload/preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  loadRendererPage(win, "onboarding.html");

  win.on("closed", () => {
    win = null;
  });
}
