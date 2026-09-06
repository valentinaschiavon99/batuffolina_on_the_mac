import { ipcMain, BrowserWindow } from "electron";
import { IPC } from "../shared/ipcChannels";
import {
  addPet,
  bumpAffection,
  getSettings,
  listPets,
  removePet,
  setSettings,
} from "./store";
import type { AppSettings, NewPetPayload } from "../shared/types";
import { openOnboardingWindow } from "./onboardingWindow";
import { openSettingsWindow } from "./settingsWindow";
import {
  openPetWindow,
  closePetWindow,
  applySettingsToOpenWindows,
  broadcastToPetWindows,
} from "./petWindowManager";
import { rebuildTrayMenu } from "./tray";
import { applyLaunchAtLogin } from "./autostart";

function dataUrlToBuffer(dataUrl: string): Buffer {
  const base64 = dataUrl.split(",")[1];
  if (!base64) throw new Error("Invalid image data URL");
  return Buffer.from(base64, "base64");
}

export function registerIpcHandlers(): void {
  ipcMain.handle(IPC.pets.list, () => listPets());

  ipcMain.handle(IPC.pets.create, (_event, payload: NewPetPayload) => {
    const pet = addPet({
      name: payload.name,
      pngBuffer: dataUrlToBuffer(payload.imageDataUrl),
      naturalWidth: payload.naturalWidth,
      naturalHeight: payload.naturalHeight,
    });
    openPetWindow(pet);
    rebuildTrayMenu();
    return pet;
  });

  ipcMain.handle(IPC.pets.remove, (_event, id: string) => {
    closePetWindow(id);
    removePet(id);
    rebuildTrayMenu();
  });

  ipcMain.on(IPC.pets.poke, (_event, id: string) => {
    bumpAffection(id);
  });

  ipcMain.handle(IPC.settings.get, () => getSettings());

  ipcMain.handle(IPC.settings.set, (_event, partial: Partial<AppSettings>) => {
    const updated = setSettings(partial);
    if (partial.launchAtLogin !== undefined) {
      applyLaunchAtLogin(updated.launchAtLogin);
    }
    // Size and always-on-top behaviour are baked into a window at creation
    // time, so those require recreating open pet windows. Everything else
    // (speed, sound) is read live or pushed over IPC — no flicker needed.
    const needsWindowRecreate =
      partial.size !== undefined || partial.stayOnTopOfFullscreen !== undefined;
    if (needsWindowRecreate) {
      applySettingsToOpenWindows();
    } else {
      broadcastToPetWindows(IPC.settings.changed, updated);
    }
    return updated;
  });

  ipcMain.on(IPC.windows.openOnboarding, () => openOnboardingWindow());
  ipcMain.on(IPC.windows.openSettings, () => openSettingsWindow());
  ipcMain.on(IPC.windows.closeCurrent, (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close();
  });
}
