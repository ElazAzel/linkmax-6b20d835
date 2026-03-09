/**
 * Editor Session Persistence
 * Saves/restores editor workflow state per page
 */

const PREFIX = 'lmx_editor_';

function getKey(key: string, pageId?: string): string {
  return pageId ? `${PREFIX}${key}_${pageId}` : `${PREFIX}${key}`;
}

// ── Recent block types (global) ──

const MAX_RECENT = 5;

export function getRecentBlockTypes(): string[] {
  try {
    const raw = sessionStorage.getItem(getKey('recent_blocks'));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addRecentBlockType(blockType: string): void {
  try {
    const recent = getRecentBlockTypes().filter((t) => t !== blockType);
    recent.unshift(blockType);
    sessionStorage.setItem(
      getKey('recent_blocks'),
      JSON.stringify(recent.slice(0, MAX_RECENT))
    );
  } catch {}
}

// ── Recent presets (global) ──

export function getRecentPresets(): string[] {
  try {
    const raw = sessionStorage.getItem(getKey('recent_presets'));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addRecentPreset(presetId: string): void {
  try {
    const recent = getRecentPresets().filter((p) => p !== presetId);
    recent.unshift(presetId);
    sessionStorage.setItem(
      getKey('recent_presets'),
      JSON.stringify(recent.slice(0, MAX_RECENT))
    );
  } catch {}
}

// ── Collapsed blocks (per page) ──

export function getCollapsedBlockIds(pageId: string): string[] {
  try {
    const raw = sessionStorage.getItem(getKey('collapsed', pageId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function setCollapsedBlockIds(pageId: string, ids: string[]): void {
  try {
    sessionStorage.setItem(getKey('collapsed', pageId), JSON.stringify(ids));
  } catch {}
}

// ── Last insert search (global) ──

export function getLastInsertSearch(): string {
  try {
    return sessionStorage.getItem(getKey('last_search')) || '';
  } catch {
    return '';
  }
}

export function setLastInsertSearch(query: string): void {
  try {
    sessionStorage.setItem(getKey('last_search'), query);
  } catch {}
}
