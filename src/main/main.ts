import { app } from "electron";
import { createTray, rebuildTrayMenu } from "./tray";
import { registerIpcHandlers } from "./ipcHandlers";
import { listPets } from "./store";
import { openPetWindow } from "./petWindowManager";
import { openOnboardingWindow } from "./onboardingWindow";
import { registerPetSchemePrivileges, registerPetProtocolHandler } from "./petProtocol";

// Privileged schemes must be declared before the app is ready.
registerPetSchemePrivileges();

// Batuffolina is a tray-only app: a second launch should just hand off to
// the already-running instance instead of spawning duplicate pet windows.
const gotSingleInstanceLock = app.requestSingleInstanceLock();

if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    rebuildTrayMenu();
  });

  app.whenReady().then(() => {
    if (process.platform === "darwin") {
      app.dock?.hide();
    }

    registerPetProtocolHandler();
    registerIpcHandlers();
    createTray();

    const pets = listPets();
    if (pets.length === 0) {
      openOnboardingWindow();
    } else {
      for (const pet of pets) openPetWindow(pet);
    }

    rebuildTrayMenu();
  });

  // A tray app has no "main window" — closing every pet window (or the
  // onboarding/settings dialogs) should never quit the app on its own.
  app.on("window-all-closed", () => {
    // Intentionally empty: stay alive in the tray until "Esci" is chosen.
  });
}
