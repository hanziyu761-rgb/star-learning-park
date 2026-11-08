import { appendEvent, newId } from '../store/db';
import type { LearningEvent } from '../store/types';

type DistributiveOmit<T, K extends keyof any> = T extends unknown ? Omit<T, K> : never;
export type NewEvent = DistributiveOmit<LearningEvent, 'id' | 'at' | 'activeMs' | 'mode' | 'learnerId' | 'lessonId'>;

/**
 * Counts only time the child is actually here: the page is visible and there
 * was an interaction in the last 60 seconds. Hidden tabs and idle phones don't count.
 */
export class ActiveTimer {
  private accumulated = 0;
  private lastTick: number;
  private lastInteraction: number;
  private timer: ReturnType<typeof setInterval> | null = null;
  static IDLE_MS = 60_000;

  constructor(private now: () => number = () => Date.now(), private isVisible: () => boolean = () => typeof document === 'undefined' || !document.hidden) {
    this.lastTick = now();
    this.lastInteraction = now();
  }

  interact(): void { this.lastInteraction = this.now(); }

  tick(): void {
    const t = this.now();
    const delta = Math.max(0, Math.min(t - this.lastTick, 5_000));
    if (this.isVisible() && t - this.lastInteraction < ActiveTimer.IDLE_MS) this.accumulated += delta;
    this.lastTick = t;
  }

  /** Returns the active time since the previous take() and resets it. */
  take(): number {
    this.tick();
    const v = this.accumulated;
    this.accumulated = 0;
    return v;
  }

  start(): void {
    if (this.timer || typeof window === 'undefined') return;
    this.timer = setInterval(() => this.tick(), 1000);
    window.addEventListener('pointerdown', this.onInteract, true);
    window.addEventListener('keydown', this.onInteract, true);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    if (typeof window !== 'undefined') {
      window.removeEventListener('pointerdown', this.onInteract, true);
      window.removeEventListener('keydown', this.onInteract, true);
    }
  }

  private onInteract = () => this.interact();
}

export class LessonRecorder {
  constructor(private learnerId: string, private lessonId: string, private timer: ActiveTimer) {}

  async record(e: NewEvent): Promise<LearningEvent> {
    const full = {
      ...e,
      id: newId(),
      at: new Date().toISOString(),
      learnerId: this.learnerId,
      lessonId: this.lessonId,
      activeMs: this.timer.take(),
      mode: 'local',
    } as LearningEvent;
    await appendEvent(full);
    return full;
  }
}
