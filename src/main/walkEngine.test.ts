import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { WalkEngine, type EngineWindow, type WorkArea } from "./walkEngine";
import type { PetActivity, PetSpeed } from "../shared/types";

class FakeWindow implements EngineWindow {
  private x: number;
  private y: number;
  private destroyed = false;
  private movedListeners: Array<() => void> = [];

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  isDestroyed(): boolean {
    return this.destroyed;
  }

  getPosition(): [number, number] {
    return [this.x, this.y];
  }

  setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
    for (const listener of this.movedListeners) listener();
  }

  on(_event: "moved", listener: () => void): void {
    this.movedListeners.push(listener);
  }

  removeListener(_event: "moved", listener: () => void): void {
    this.movedListeners = this.movedListeners.filter((l) => l !== listener);
  }

  destroy(): void {
    this.destroyed = true;
  }

  /** Simulates the user dragging the window, bypassing WalkEngine's own setPosition. */
  simulateUserDragTo(x: number, y: number): void {
    this.x = x;
    this.y = y;
    for (const listener of this.movedListeners) listener();
  }
}

const WORK_AREA: WorkArea = { x: 0, y: 0, width: 1000, height: 800 };
const PET_WIDTH = 100;
const PET_HEIGHT = 100;

function createEngine(
  win: FakeWindow,
  speed: PetSpeed,
  onActivity: (a: PetActivity) => void,
): WalkEngine {
  return new WalkEngine(win, () => WORK_AREA, PET_WIDTH, PET_HEIGHT, () => speed, onActivity);
}

describe("WalkEngine", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("announces idle immediately on start", () => {
    const win = new FakeWindow(0, 700);
    const activities: PetActivity[] = [];
    const engine = createEngine(win, "normal", (a) => activities.push(a));

    engine.start();

    expect(activities).toEqual([{ kind: "idle" }]);
    engine.stop();
  });

  it("eventually starts walking and stays within the work area", () => {
    const win = new FakeWindow(500, 700);
    const activities: PetActivity[] = [];
    const engine = createEngine(win, "fast", (a) => activities.push(a));

    engine.start();
    // Idle lasts at most 5.5s; walking then continues until it reaches a
    // random target, which for a 1000px-wide area at "fast" speed takes a
    // few seconds at most. 20s of simulated time is comfortably enough.
    vi.advanceTimersByTime(20_000);

    expect(activities.some((a) => a.kind === "walking")).toBe(true);
    const [x] = win.getPosition();
    expect(x).toBeGreaterThanOrEqual(WORK_AREA.x);
    expect(x).toBeLessThanOrEqual(WORK_AREA.x + WORK_AREA.width - PET_WIDTH);
    engine.stop();
  });

  it("keeps the pet on the floor line of the work area while walking", () => {
    const win = new FakeWindow(500, 12345); // absurd starting y, should self-correct
    const activities: PetActivity[] = [];
    const engine = createEngine(win, "fast", (a) => activities.push(a));

    engine.start();
    vi.advanceTimersByTime(10_000);

    const [, y] = win.getPosition();
    expect(y).toBe(WORK_AREA.y + WORK_AREA.height - PET_HEIGHT);
    engine.stop();
  });

  it("pauses autonomous movement after the user drags the pet, then resumes", () => {
    const win = new FakeWindow(500, 700);
    const activities: PetActivity[] = [];
    const engine = createEngine(win, "fast", (a) => activities.push(a));

    engine.start();
    vi.advanceTimersByTime(3_000); // let it start walking

    win.simulateUserDragTo(50, 50); // user picks it up and drops it elsewhere
    const positionRightAfterDrag = win.getPosition();

    // Immediately after a drag, the engine should not fight the user.
    vi.advanceTimersByTime(1000); // well under the 1500ms cooldown
    expect(win.getPosition()).toEqual(positionRightAfterDrag);

    // After the cooldown it should resume on its own again.
    vi.advanceTimersByTime(10_000);
    expect(win.getPosition()).not.toEqual(positionRightAfterDrag);

    engine.stop();
  });

  it("stops ticking once the window is destroyed", () => {
    const win = new FakeWindow(500, 700);
    const engine = createEngine(win, "fast", () => {});
    engine.start();
    win.destroy();

    expect(() => vi.advanceTimersByTime(5000)).not.toThrow();
  });
});
