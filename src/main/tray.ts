import { app, Menu, Tray, nativeImage } from "electron";
import path from "node:path";
import { listPets, removePet } from "./store";
import { openOnboardingWindow } from "./onboardingWindow";
import { openSettingsWindow } from "./settingsWindow";
import { openPetWindow, closePetWindow, isPetWindowOpen } from "./petWindowManager";

let tray: Tray | null = null;

function loadTrayIcon() {
  const iconPath = path.join(__dirname, "../../build/trayIcon.png");
  const image = nativeImage.createFromPath(iconPath);
  // Fall back to an empty (but valid) image rather than crash if the icon
  // asset is missing — a tray with a blank icon still works.
  return image.isEmpty() ? nativeImage.createEmpty() : image;
}

export function createTray(): Tray {
  tray = new Tray(loadTrayIcon());
  tray.setToolTip("Batuffolina");
  rebuildTrayMenu();
  return tray;
}

export function rebuildTrayMenu(): void {
  if (!tray) return;
  const pets = listPets();

  const petItems = pets.map((pet) => ({
    label: pet.name,
    submenu: [
      {
        label: isPetWindowOpen(pet.id) ? "Nascondi dal desktop" : "Mostra sul desktop",
        click: () => {
          if (isPetWindowOpen(pet.id)) closePetWindow(pet.id);
          else openPetWindow(pet);
          rebuildTrayMenu();
        },
      },
      {
        label: `Coccole ricevute: ${pet.affection}`,
        enabled: false,
      },
      { type: "separator" as const },
      {
        label: "Rimuovi definitivamente",
        click: () => {
          closePetWindow(pet.id);
          removePet(pet.id);
          rebuildTrayMenu();
        },
      },
    ],
  }));

  const menu = Menu.buildFromTemplate([
    { label: "Aggiungi un nuovo Batuffolina…", click: () => openOnboardingWindow() },
    { type: "separator" },
    ...(petItems.length
      ? petItems
      : [{ label: "Nessun pet ancora — aggiungine uno!", enabled: false }]),
    { type: "separator" },
    { label: "Impostazioni…", click: () => openSettingsWindow() },
    { label: "Esci da Batuffolina", click: () => app.quit() },
  ]);

  tray.setContextMenu(menu);
}
