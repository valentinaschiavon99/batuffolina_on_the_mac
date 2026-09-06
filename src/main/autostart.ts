import { app } from "electron";

/** Registers (or unregisters) Batuffolina as a login item for the OS. */
export function applyLaunchAtLogin(enabled: boolean): void {
  // Login items aren't meaningful (or supported the same way) for every
  // platform electron-builder can target; setLoginItemSettings itself is a
  // no-op on Linux, which is exactly the graceful behaviour we want here.
  app.setLoginItemSettings({ openAtLogin: enabled });
}
