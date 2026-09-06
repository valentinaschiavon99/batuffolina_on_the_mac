import { BrowserWindow, screen } from "electron";
import path from "node:path";
import { WalkEngine, type EngineWindow } from "./walkEngine";
import { IPC } from "../shared/ipcChannels";
import type { AppSettings, PetProfile, PetSize } from "../shared/types";
import { getSettings, listPets } from "./store";
import { loadRendererPage } from "./windowUrl";

const SIZE_MULTIPLIER: Record<PetSize, number> = {
  small: 0.7,
  normal: 1,
  large: 1.4,
};

/** Target on-screen height in CSS pixels for a "normal"-sized pet. */
const BASE_TARGET_HEIGHT = 180;

interface OpenPetWindow {
  window: BrowserWindow;
  engine: WalkEngine;
}

const openWindows = new Map<string, OpenPetWindow>();

function computeWindowSize(pet: PetProfile, settings: AppSettings): { width: number; height: number } {
  const targetHeight = BASE_TARGET_HEIGHT * SIZE_MULTIPLIER[settings.size];
  const scale = targetHeight / pet.naturalHeight;
  return {
    width: Math.max(48, Math.round(pet.naturalWidth * scale)),
    height: Math.max(48, Math.round(targetHeight)),
  };
}

export function isPetWindowOpen(id: string): boolean {
  return openWindows.has(id);
}

export function openPetWindow(pet: PetProfile): void {
  const existing = openWindows.get(pet.id);
  if (existing) {
    existing.window.show();
    return;
  }

  const settings = getSettings();
  const { width, height } = computeWindowSize(pet, settings);
  const display = screen.getPrimaryDisplay();
  const startX =
    display.workArea.x + Math.random() * Math.max(1, display.workArea.width - width);
  const startY = display.workArea.y + display.workArea.height - height;

  const win = new BrowserWindow({
    width,
    height,
    x: Math.round(startX),
    y: Math.round(startY),
    frame: false,
    transparent: true,
    hasShadow: false,
    resizable: false,
    movable: true,
    skipTaskbar: true,
    alwaysOnTop: true,
    focusable: false,
    webPreferences: {
      preload: path.join(__dirname, "../preload/preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.setAlwaysOnTop(true, settings.stayOnTopOfFullscreen ? "screen-saver" : "floating");
  if (process.platform === "darwin") {
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: settings.stayOnTopOfFullscreen });
  }

  loadRendererPage(win, "pet.html", { petId: pet.id });

  const engineWindow: EngineWindow = {
    isDestroyed: () => win.isDestroyed(),
    getPosition: () => win.getPosition() as [number, number],
    setPosition: (x, y) => {
      if (!win.isDestroyed()) win.setPosition(x, y);
    },
    on: (event, listener) => win.on(event, listener),
    removeListener: (event, listener) => win.removeListener(event, listener),
  };

  const engine = new WalkEngine(
    engineWindow,
    () => {
      const [x, y] = win.isDestroyed() ? [startX, startY] : win.getPosition();
      return screen.getDisplayNearestPoint({ x, y }).workArea;
    },
    width,
    height,
    () => getSettings().speed,
    (activity) => {
      if (!win.isDestroyed()) win.webContents.send(IPC.pet.activity, activity);
    },
  );
  engine.start();

  win.on("closed", () => {
    engine.stop();
    openWindows.delete(pet.id);
  });

  openWindows.set(pet.id, { window: win, engine });
}

export function closePetWindow(id: string): void {
  const entry = openWindows.get(id);
  if (!entry) return;
  entry.engine.stop();
  if (!entry.window.isDestroyed()) entry.window.close();
  openWindows.delete(id);
}

export function closeAllPetWindows(): void {
  for (const id of Array.from(openWindows.keys())) closePetWindow(id);
}

/**
 * Re-creates every currently open pet window so a settings change that
 * affects window geometry (size, always-on-top behaviour) takes effect
 * immediately. Walking speed doesn't need this — WalkEngine reads it live
 * on every tick — and other settings are pushed via broadcastToPetWindows.
 */
export function applySettingsToOpenWindows(): void {
  const openIds = Array.from(openWindows.keys());
  const pets = listPets();
  for (const id of openIds) {
    const pet = pets.find((p) => p.id === id);
    closePetWindow(id);
    if (pet) openPetWindow(pet);
  }
}

/** Sends an IPC message to every currently open pet window. */
export function broadcastToPetWindows<T>(channel: string, payload: T): void {
  for (const { window } of openWindows.values()) {
    if (!window.isDestroyed()) window.webContents.send(channel, payload);
  }
}
