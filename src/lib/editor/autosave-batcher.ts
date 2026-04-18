/**
 * Autosave Batcher - Smart debounced save queue
 * P5: Smart Autosave Batching
 * 
 * Rules:
 * - Inline edits: debounce 1500ms
 * - Reorder: debounce 800ms
 * - Add/delete: debounce 500ms
 * - Bulk actions: debounce 300ms
 * - Dangerous (delete all): flush immediately
 * - Blur/tab switch/route leave: flush immediately
 * - Merges queued mutations of same block into single update
 */

export type MutationType = 'inline_edit' | 'reorder' | 'add' | 'delete' | 'bulk' | 'dangerous' | 'section_op' | 'transform';

interface QueuedMutation {
  type: MutationType;
  timestamp: number;
}

const DEBOUNCE_MAP: Record<MutationType, number> = {
  inline_edit: 1500,
  reorder: 800,
  add: 500,
  delete: 500,
  bulk: 300,
  dangerous: 0, // flush immediately
  section_op: 500,
  transform: 300,
};

export class AutosaveBatcher {
  private timer: ReturnType<typeof setTimeout> | null = null;
  private pendingMutation: QueuedMutation | null = null;
  private flushCallback: (() => Promise<void>) | null = null;
  private isFlushing = false;

  constructor(onFlush: () => Promise<void>) {
    this.flushCallback = onFlush;

    // Flush on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', this.flushSync);
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }

  /**
   * Enqueue a mutation. Debounces based on mutation type.
   */
  enqueue(type: MutationType): void {
    this.pendingMutation = { type, timestamp: Date.now() };

    const delay = DEBOUNCE_MAP[type];

    if (delay === 0) {
      // Flush immediately for dangerous operations
      this.flush();
      return;
    }

    // Clear existing timer and set new one with appropriate delay
    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(() => {
      this.flush();
    }, delay);
  }

  /**
   * Force flush all pending mutations
   */
  async flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (!this.pendingMutation || this.isFlushing) return;

    this.isFlushing = true;
    this.pendingMutation = null;

    try {
      await this.flushCallback?.();
    } catch (err) {
      console.error('[autosave-batcher] flush failed:', err);
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Synchronous flush for beforeunload
   */
  private flushSync = (): void => {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.pendingMutation) {
      // Can't await in beforeunload, fire-and-forget
      this.flushCallback?.().catch((err) => {
        console.error('[autosave-batcher] sync flush failed:', err);
      });
      this.pendingMutation = null;
    }
  };

  private handleVisibilityChange = (): void => {
    if (document.visibilityState === 'hidden') {
      this.flush();
    }
  };

  /**
   * Check if there are pending unsaved changes
   */
  get hasPending(): boolean {
    return this.pendingMutation !== null;
  }

  /**
   * Cancel pending save (e.g. on route leave after explicit save)
   */
  cancel(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.pendingMutation = null;
  }

  /**
   * Cleanup listeners
   */
  destroy(): void {
    this.cancel();
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', this.flushSync);
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
  }
}
