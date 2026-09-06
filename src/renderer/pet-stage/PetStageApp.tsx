import { useEffect, useMemo, useRef, useState } from "react";
import type { AppSettings, PetActivity, PetProfile } from "../../shared/types";
import { DEFAULT_SETTINGS } from "../../shared/types";
import { petImageUrl } from "../../shared/petImage";
import { playPokeChime } from "./sound";

const SIT_AFTER_MS = 7000;
const SLEEP_AFTER_MS = 22000;
const IDLE_POLL_MS = 500;
const POKE_ANIMATION_MS = 350;
const HEART_LIFETIME_MS = 900;

type VisualState = "idle" | "walking" | "sitting" | "sleeping";

function usePetIdFromQuery(): string | null {
  return useMemo(() => new URLSearchParams(window.location.search).get("petId"), []);
}

export function PetStageApp(): JSX.Element | null {
  const petId = usePetIdFromQuery();
  const [pet, setPet] = useState<PetProfile | null>(null);
  const [activity, setActivity] = useState<PetActivity>({ kind: "idle" });
  const [visualState, setVisualState] = useState<VisualState>("idle");
  const [facingLeft, setFacingLeft] = useState(false);
  const [isPoking, setIsPoking] = useState(false);
  const [hearts, setHearts] = useState<number[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  const idleSinceRef = useRef<number>(Date.now());
  const pokeTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const heartCounterRef = useRef(0);

  // Load this window's pet once we know which id the main process gave it.
  useEffect(() => {
    let cancelled = false;
    if (!petId) return;
    window.batuffolina.pets.list().then((pets) => {
      if (cancelled) return;
      setPet(pets.find((p) => p.id === petId) ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [petId]);

  // Read the current settings, then stay in sync with later changes: sound,
  // opacity, shadow and napping all apply live, without recreating the window.
  useEffect(() => {
    let cancelled = false;
    window.batuffolina.settings.get().then((current) => {
      if (!cancelled) setSettings(current);
    });
    const unsubscribe = window.batuffolina.settings.onChange(setSettings);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  // React to coarse walking/idle updates pushed from the WalkEngine.
  useEffect(() => {
    return window.batuffolina.pet.onActivity((next) => {
      setActivity(next);
      idleSinceRef.current = Date.now();
      if (next.kind === "walking") {
        setFacingLeft(next.direction === "left");
        setVisualState("walking");
      } else {
        setVisualState("idle");
      }
    });
  }, []);

  // While idle, gradually settle into sitting, then (unless naps are off)
  // falling asleep.
  useEffect(() => {
    if (activity.kind !== "idle") return undefined;
    const interval = setInterval(() => {
      const elapsed = Date.now() - idleSinceRef.current;
      if (elapsed >= SLEEP_AFTER_MS && settings.napEnabled) setVisualState("sleeping");
      else if (elapsed >= SIT_AFTER_MS) setVisualState("sitting");
    }, IDLE_POLL_MS);
    return () => clearInterval(interval);
  }, [activity, settings.napEnabled]);

  // Turning naps off while the pet is already asleep should wake it up.
  useEffect(() => {
    if (!settings.napEnabled) {
      setVisualState((current) => (current === "sleeping" ? "sitting" : current));
    }
  }, [settings.napEnabled]);

  useEffect(() => {
    return () => {
      if (pokeTimeoutRef.current) clearTimeout(pokeTimeoutRef.current);
    };
  }, []);

  function handlePoke(): void {
    if (!pet) return;
    window.batuffolina.pets.poke(pet.id);
    if (settings.soundEnabled) playPokeChime(settings.soundVolume);

    // A poke wakes the pet right back up, whatever it was doing.
    idleSinceRef.current = Date.now();
    setVisualState(activity.kind === "walking" ? "walking" : "idle");

    setIsPoking(true);
    if (pokeTimeoutRef.current) clearTimeout(pokeTimeoutRef.current);
    pokeTimeoutRef.current = setTimeout(() => setIsPoking(false), POKE_ANIMATION_MS);

    const heartId = heartCounterRef.current++;
    setHearts((prev) => [...prev, heartId]);
    setTimeout(() => {
      setHearts((prev) => prev.filter((id) => id !== heartId));
    }, HEART_LIFETIME_MS);
  }

  if (!pet) return null;

  const classNames = [
    "pet-image",
    `state-${visualState}`,
    isPoking ? "poked" : "",
    settings.shadowEnabled ? "" : "no-shadow",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className="pet-stage"
      onClick={handlePoke}
      title={pet.name}
      style={{ opacity: Math.max(0.1, Math.min(1, settings.opacityPercent / 100)) }}
    >
      <div className="pet-flip" style={{ transform: facingLeft ? "scaleX(-1)" : "scaleX(1)" }}>
        <img
          src={petImageUrl(pet.id)}
          alt={pet.name}
          className={classNames}
          draggable={false}
        />
      </div>
      {visualState === "sleeping" && <span className="zzz">💤</span>}
      {hearts.map((id) => (
        <span key={id} className="heart-burst">
          💖
        </span>
      ))}
    </div>
  );
}
