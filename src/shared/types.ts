/**
 * Types shared between the Electron main process, the preload bridge and
 * the renderer (React) code. Keeping these in one place is what lets the
 * IPC boundary stay type-safe end to end.
 */

export interface PetProfile {
  id: string;
  name: string;
  /** Absolute path on disk to the cut-out PNG (transparent background). */
  imagePath: string;
  /** Natural pixel size of the cutout, used to size the pet window. */
  naturalWidth: number;
  naturalHeight: number;
  createdAt: number;
  /** How many times the pet has been poked/petted. A little counter of love. */
  affection: number;
}

export type PetSpeed = "slow" | "normal" | "fast";
export type PetSize = "small" | "normal" | "large";

export interface AppSettings {
  speed: PetSpeed;
  size: PetSize;
  soundEnabled: boolean;
  launchAtLogin: boolean;
  /** Keep the pet visible above fullscreen apps too (macOS/Windows). */
  stayOnTopOfFullscreen: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  speed: "normal",
  size: "normal",
  soundEnabled: true,
  launchAtLogin: false,
  stayOnTopOfFullscreen: false,
};

/** Coarse activity broadcast by the main-process walk engine to a pet window. */
export type PetActivity =
  | { kind: "walking"; direction: "left" | "right" }
  | { kind: "idle" };

export interface PetWindowInit {
  pet: PetProfile;
  settings: AppSettings;
}

/** Data URL produced by the onboarding cutout editor, ready to be saved. */
export interface NewPetPayload {
  name: string;
  /** PNG data URL, transparent background, already cropped to content. */
  imageDataUrl: string;
  naturalWidth: number;
  naturalHeight: number;
}
