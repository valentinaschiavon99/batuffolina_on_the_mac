import type { SoundVolume } from "../../shared/types";

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) audioContext = new AudioContext();
  return audioContext;
}

/** Peak gain per volume setting — deliberately gentle, this plays next to someone working. */
const PEAK_GAIN: Record<SoundVolume, number> = {
  soft: 0.05,
  normal: 0.15,
  loud: 0.32,
};

/**
 * A short, cheerful two-note chime played when the pet is poked. Synthesized
 * with the Web Audio API instead of shipping an audio asset — one less
 * licensing question, one less file to bundle.
 */
export function playPokeChime(volume: SoundVolume = "normal"): void {
  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") void ctx.resume();

    const peak = PEAK_GAIN[volume] ?? PEAK_GAIN.normal;
    const now = ctx.currentTime;
    const notes = [660, 880];
    for (const [index, frequency] of notes.entries()) {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;

      const start = now + index * 0.08;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(peak, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);

      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.2);
    }
  } catch (error) {
    console.warn("[batuffolina] impossibile riprodurre il suono", error);
  }
}
