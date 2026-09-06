import { contextBridge, ipcRenderer } from "electron";
import { IPC } from "../shared/ipcChannels";
import type { AppSettings, NewPetPayload, PetActivity, PetProfile } from "../shared/types";

/**
 * The only surface the renderer gets to talk to Electron through. Nothing
 * here exposes ipcRenderer, fs, or any Node API directly — every call is a
 * named, typed function, which is the whole point of contextIsolation.
 */
const api = {
  pets: {
    list: (): Promise<PetProfile[]> => ipcRenderer.invoke(IPC.pets.list),
    create: (payload: NewPetPayload): Promise<PetProfile> =>
      ipcRenderer.invoke(IPC.pets.create, payload),
    remove: (id: string): Promise<void> => ipcRenderer.invoke(IPC.pets.remove, id),
    poke: (id: string): void => ipcRenderer.send(IPC.pets.poke, id),
  },
  settings: {
    get: (): Promise<AppSettings> => ipcRenderer.invoke(IPC.settings.get),
    set: (partial: Partial<AppSettings>): Promise<AppSettings> =>
      ipcRenderer.invoke(IPC.settings.set, partial),
    /** Subscribe to settings changes pushed from the main process. Returns an unsubscribe function. */
    onChange: (callback: (settings: AppSettings) => void): (() => void) => {
      const listener = (_event: Electron.IpcRendererEvent, settings: AppSettings): void =>
        callback(settings);
      ipcRenderer.on(IPC.settings.changed, listener);
      return () => ipcRenderer.removeListener(IPC.settings.changed, listener);
    },
  },
  windows: {
    openOnboarding: (): void => ipcRenderer.send(IPC.windows.openOnboarding),
    openSettings: (): void => ipcRenderer.send(IPC.windows.openSettings),
    closeCurrent: (): void => ipcRenderer.send(IPC.windows.closeCurrent),
  },
  pet: {
    /** Subscribe to coarse activity updates for this pet window. Returns an unsubscribe function. */
    onActivity: (callback: (activity: PetActivity) => void): (() => void) => {
      const listener = (_event: Electron.IpcRendererEvent, activity: PetActivity): void =>
        callback(activity);
      ipcRenderer.on(IPC.pet.activity, listener);
      return () => ipcRenderer.removeListener(IPC.pet.activity, listener);
    },
  },
};

export type BatuffolinaApi = typeof api;

contextBridge.exposeInMainWorld("batuffolina", api);
