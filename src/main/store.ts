import Store from "electron-store";
import { randomUUID } from "node:crypto";
import { app } from "electron";
import path from "node:path";
import fs from "node:fs";
import type { AppSettings, PetProfile } from "../shared/types";
import { DEFAULT_SETTINGS } from "../shared/types";

interface StoreShape {
  pets: PetProfile[];
  settings: AppSettings;
}

const store = new Store<StoreShape>({
  name: "batuffolina-data",
  defaults: {
    pets: [],
    settings: DEFAULT_SETTINGS,
  },
});

/** Directory where cutout PNGs live, e.g. <userData>/pets/<id>.png */
export function petsDir(): string {
  const dir = path.join(app.getPath("userData"), "pets");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function listPets(): PetProfile[] {
  return store.get("pets");
}

export function addPet(input: {
  name: string;
  pngBuffer: Buffer;
  naturalWidth: number;
  naturalHeight: number;
}): PetProfile {
  const id = randomUUID();
  const imagePath = path.join(petsDir(), `${id}.png`);
  fs.writeFileSync(imagePath, input.pngBuffer);

  const pet: PetProfile = {
    id,
    name: input.name.trim() || "Batuffolina",
    imagePath,
    naturalWidth: input.naturalWidth,
    naturalHeight: input.naturalHeight,
    createdAt: Date.now(),
    affection: 0,
  };

  const pets = listPets();
  pets.push(pet);
  store.set("pets", pets);
  return pet;
}

export function removePet(id: string): void {
  const pets = listPets();
  const target = pets.find((p) => p.id === id);
  const remaining = pets.filter((p) => p.id !== id);
  store.set("pets", remaining);
  if (target) {
    try {
      fs.unlinkSync(target.imagePath);
    } catch {
      // Already gone, or never existed on disk — nothing to clean up.
    }
  }
}

export function bumpAffection(id: string): PetProfile | undefined {
  const pets = listPets();
  const pet = pets.find((p) => p.id === id);
  if (!pet) return undefined;
  pet.affection += 1;
  store.set("pets", pets);
  return pet;
}

export function getSettings(): AppSettings {
  return { ...DEFAULT_SETTINGS, ...store.get("settings") };
}

export function setSettings(partial: Partial<AppSettings>): AppSettings {
  const merged = { ...getSettings(), ...partial };
  store.set("settings", merged);
  return merged;
}
