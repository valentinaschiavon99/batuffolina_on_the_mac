let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) audioContext = new AudioContext();
  return audioContext;
}

/**
 * A short, cheerful two-note chime played when the pet is poked. Synthesized
 * with the Web Audio API instead of shipping an audio asset — one less
 * licensing question, one less file to bundle.
 */
export function playPokeChime(): void {
  try {
    const ctx = getAudioContext();
    if (ctx.state === "suspended") void ctx.resume();

    const now = ctx.currentTime;
    const notes = [660, 880];
    for (const [index, frequency] of notes.entries()) {
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;

      const start = now + index * 0.08;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.15, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);

      oscillator.connect(gain).connect(ctx.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.2);
    }
  } catch (error) {
    console.warn("[batuffolina] impossibile riprodurre il suono", error);
  }
}
