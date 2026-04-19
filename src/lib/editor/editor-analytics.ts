/**
 * Editor Analytics - Friction tracking for editor interactions
 * Tracks meaningful editor events to understand bottlenecks
 */
import type { Json } from '@/platform/supabase/types';

export type EditorAnalyticsAction =
  | 'block_added'
  | 'block_deleted'
  | 'block_duplicated'
  | 'block_reordered'
  | 'inline_edit_started'
  | 'inline_edit_saved'
  | 'inline_edit_cancelled'
  | 'full_editor_opened'
  | 'full_editor_saved'
  | 'quick_action_used'
  | 'command_palette_opened'
  | 'command_executed'
  | 'structure_view_opened'
  | 'block_collapsed'
  | 'block_expanded'
  | 'undo_used'
  | 'redo_used'
  | 'validation_error_seen'
  | 'preset_used'
  | 'template_used'
  | 'block_insert_search_used'
  // P4: Multi-select & interaction
  | 'keyboard_navigate'
  | 'inline_edit_opened'
  | 'select_all'
  | 'block_copied'
  | 'block_pasted'
  | 'bulk_action_used'
  | 'selection_changed'
  // P5: Sections
  | 'section_created'
  | 'section_dissolved'
  | 'section_collapsed'
  | 'section_moved'
  | 'section_duplicated'
  | 'section_deleted'
  | 'section_merged'
  // P5: Review modes
  | 'review_mode_entered'
  | 'review_mode_exited'
  // P5: Transform
  | 'transform_used'
  | 'transform_cancelled'
  // P5: Friction recovery
  | 'friction_detected'
  | 'friction_suggestion_accepted'
  | 'friction_suggestion_dismissed'
  // P5: Autosave & history
  | 'autosave_batch_flushed'
  | 'history_compressed';

export interface EditorAnalyticsMeta {
  blockType?: string;
  blockId?: string;
  position?: number;
  source?: 'grid' | 'structure' | 'palette' | 'preset' | 'keyboard' | 'toolbar';
  presetId?: string;
  commandId?: string;
  searchQuery?: string;
  duration?: number;
  [key: string]: unknown;
}

// Debounce rapid identical events
let lastEvent: { action: string; time: number } | null = null;
const DEBOUNCE_MS = 300;

/**
 * Track an editor action for friction analysis.
 * In production, sends to analytics table. In dev, logs to console.
 */
export function trackEditorAction(
  action: EditorAnalyticsAction,
  meta?: EditorAnalyticsMeta
): void {
  const now = Date.now();

  // Debounce rapid identical events (e.g. rapid inline edits)
  if (lastEvent && lastEvent.action === action && now - lastEvent.time < DEBOUNCE_MS) {
    return;
  }
  lastEvent = { action, time: now };

  // Fire-and-forget to analytics
  try {
    if (import.meta.env.DEV) {
      console.debug(`[editor-analytics] ${action}`, meta);
    }

    // Insert into analytics table async
    import('@/platform/supabase/client').then(({ supabase }) => {
      supabase
        .from('analytics')
        .insert([{
          event_type: `editor:${action}`,
          metadata: meta ? (JSON.parse(JSON.stringify(meta)) as Json) : null,
          page_id: null as unknown as string,
          block_id: meta?.blockId ?? null,
        }])
        .then(() => {});
    });
  } catch {
    // Never throw from analytics
  }
}

/**
 * Create a timing tracker for measuring flow durations
 */
export function createFlowTimer(flowName: string) {
  const start = Date.now();
  return {
    end: (meta?: EditorAnalyticsMeta) => {
      const duration = Date.now() - start;
      trackEditorAction(flowName as EditorAnalyticsAction, { ...meta, duration });
    },
  };
}
