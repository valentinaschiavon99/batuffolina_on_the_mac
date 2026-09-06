import type { PetActivity, PetActivityLevel, PetSpeed } from "../shared/types";

/**
 * The minimal window surface WalkEngine needs. Real code passes it an
 * Electron BrowserWindow; tests pass a tiny fake — that's the whole reason
 * this is an interface instead of importing BrowserWindow directly.
 */
export interface EngineWindow {
  isDestroyed(): boolean;
  getPosition(): [number, number];
  setPosition(x: number, y: number): void;
  on(event: "moved", listener: () => void): void;
  removeListener(event: "moved", listener: () => void): void;
}

export interface WorkArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

const TICK_MS = 33; // ~30fps — plenty smooth for a window-position walk cycle
const MANUAL_COOLDOWN_MS = 1500; // pause autonomy for a bit after the user drags the pet

const SPEED_PX_PER_SEC: Record<PetSpeed, number> = {
  slow: 40,
  normal: 70,
  fast: 110,
};

/** How long the pet rests between walks, per activity level: [min, max] ms. */
const IDLE_RANGE_MS: Record<PetActivityLevel, [number, number]> = {
  lazy: [4000, 15000],
  normal: [1200, 5500],
  hyper: [400, 2000],
};

export interface WalkEngineOptions {
  window: EngineWindow;
  getWorkArea: () => WorkArea;
  petWidth: number;
  petHeight: number;
  /** Read live on every tick, so settings changes apply without restarting. */
  getSpeed: () => PetSpeed;
  getActivityLevel: () => PetActivityLevel;
  onActivity: (activity: PetActivity) => void;
}

/**
 * Owns one pet's on-screen position. It walks the window back and forth
 * along the bottom of the current display's work area, pausing to idle
 * between walks, and steps out of the way entirely for a few seconds
 * whenever it notices the window moved for a reason it didn't cause
 * (the user dragging it via -webkit-app-region: drag).
 */
export class WalkEngine {
  private state: "idle" | "walking" = "idle";
  private direction: 1 | -1 = 1;
  private targetX = 0;
  private idleUntil = 0;
  private lastManualMoveAt = 0;
  /** The last position WE told the window to take, used to tell our own 'moved' echo apart from a real user drag. */
  private lastProgrammaticPosition: { x: number; y: number } | undefined;
  private timer: ReturnType<typeof setInterval> | undefined;
  private lastActivitySent: PetActivity | undefined;
  private readonly onMoved = () => this.handleWindowMoved();
  private readonly win: EngineWindow;

  constructor(private readonly options: WalkEngineOptions) {
    this.win = options.window;
  }

  start(): void {
    this.win.on("moved", this.onMoved);
    this.pickNewIdle();
    this.timer = setInterval(() => this.tick(), TICK_MS);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.win.removeListener("moved", this.onMoved);
  }

  /**
   * Called whenever the window's 'moved' event fires, for any reason —
   * including our own setPosition calls while walking. We tell those apart
   * from a genuine user drag by comparing the window's reported position
   * to the last position we ourselves asked for: a time-based window
   * doesn't work here, since while walking we move the window roughly
   * every tick, so "recently moved by us" would be true almost always.
   */
  private handleWindowMoved(): void {
    const [x, y] = this.win.getPosition();
    const own = this.lastProgrammaticPosition;
    if (own && own.x === x && own.y === y) return; // our own echo, ignore
    this.lastManualMoveAt = Date.now();
    this.state = "idle";
    this.setActivity({ kind: "idle" });
  }

  private pickNewIdle(): void {
    const [minMs, maxMs] = IDLE_RANGE_MS[this.options.getActivityLevel()];
    this.state = "idle";
    this.idleUntil = Date.now() + minMs + Math.random() * (maxMs - minMs);
    this.setActivity({ kind: "idle" });
  }

  private pickNewWalkTarget(): void {
    const area = this.options.getWorkArea();
    const minX = area.x;
    const maxX = area.x + area.width - this.options.petWidth;
    if (maxX <= minX) {
      // Display too narrow for the pet (unlikely) — just stay idle.
      this.pickNewIdle();
      return;
    }
    this.targetX = minX + Math.random() * (maxX - minX);
    const [currentX] = this.win.getPosition();
    this.direction = this.targetX >= currentX ? 1 : -1;
    this.state = "walking";
    this.setActivity({ kind: "walking", direction: this.direction === 1 ? "right" : "left" });
  }

  private setActivity(activity: PetActivity): void {
    const changed =
      !this.lastActivitySent ||
      this.lastActivitySent.kind !== activity.kind ||
      (activity.kind === "walking" &&
        this.lastActivitySent.kind === "walking" &&
        this.lastActivitySent.direction !== activity.direction);
    if (!changed) return;
    this.lastActivitySent = activity;
    this.options.onActivity(activity);
  }

  private moveWindowTo(x: number, y: number): void {
    const roundedX = Math.round(x);
    const roundedY = Math.round(y);
    // Record what we're about to set so handleWindowMoved can recognize
    // the 'moved' event this triggers as its own echo, not a user drag.
    this.lastProgrammaticPosition = { x: roundedX, y: roundedY };
    this.win.setPosition(roundedX, roundedY);
  }

  private tick(): void {
    if (this.win.isDestroyed()) {
      this.stop();
      return;
    }

    const now = Date.now();
    if (now - this.lastManualMoveAt < MANUAL_COOLDOWN_MS) {
      return; // the user just picked the pet up — leave it be
    }

    const area = this.options.getWorkArea();
    const floorY = area.y + area.height - this.options.petHeight;
    const [x] = this.win.getPosition();

    if (this.state === "idle") {
      if (now >= this.idleUntil) {
        this.pickNewWalkTarget();
      }
      return;
    }

    // Walking: step toward targetX at the configured speed.
    const speed = SPEED_PX_PER_SEC[this.options.getSpeed()];
    const stepPx = (speed * TICK_MS) / 1000;
    const remaining = this.targetX - x;
    const arrived = Math.abs(remaining) <= stepPx;
    const nextX = arrived ? this.targetX : x + stepPx * this.direction;
    this.moveWindowTo(nextX, floorY);

    if (arrived) {
      this.pickNewIdle();
    }
  }
}
