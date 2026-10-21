export interface CoverPosition { x?: number; y?: number }

export function normalizeCoverPosition(value?: CoverPosition | null) {
  const clamp = (n?: number) => typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 50;
  return { x: clamp(value?.x), y: clamp(value?.y) };
}

export function getCoverPositionStyle(value?: CoverPosition | null) {
  const { x, y } = normalizeCoverPosition(value);
  return { objectPosition: `${x}% ${y}%` };
}
