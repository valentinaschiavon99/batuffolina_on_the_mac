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
/** How often the pet decides to walk. Orthogonal to speed, which is how fast it walks. */
export type PetActivityLevel = "lazy" | "normal" | "hyper";
export type SoundVolume = "soft" | "normal" | "loud";

export interface AppSettings {
  speed: PetSpeed;
  size: PetSize;
  activityLevel: PetActivityLevel;
  /** When false the pet never falls asleep, however long it has been still. */
  napEnabled: boolean;
  /** 100 = fully opaque. Lower values let windows underneath show through. */
  opacityPercent: number;
  shadowEnabled: boolean;
  soundEnabled: boolean;
  soundVolume: SoundVolume;
  launchAtLogin: boolean;
  /** Keep the pet visible above fullscreen apps too (macOS/Windows). */
  stayOnTopOfFullscreen: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  speed: "normal",
  size: "normal",
  activityLevel: "normal",
  napEnabled: true,
  opacityPercent: 100,
  shadowEnabled: true,
  soundEnabled: true,
  soundVolume: "normal",
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
