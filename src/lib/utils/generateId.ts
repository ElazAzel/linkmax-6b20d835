/**
 * Generate a unique ID string.
 * Uses crypto.randomUUID() when available, falls back to Math.random().
 */
export function generateId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    // Fallback for environments without crypto.randomUUID
    return (
        Math.random().toString(36).slice(2, 10) +
        Math.random().toString(36).slice(2, 10)
    );
}
