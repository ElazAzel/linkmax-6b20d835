import type { CSSProperties } from 'react';
export interface ImagePlacement { x?: number; y?: number; zoom?: number; rotation?: number; flipX?: boolean; flipY?: boolean }
export function getImagePlacementStyle(block: { scale?: string; imagePlacement?: ImagePlacement }): CSSProperties {
  const finite = (value: number | undefined, fallback: number, min: number, max: number) => typeof value === 'number' && Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
  const p = block.imagePlacement || {};
  const x = finite(p.x, 50, 0, 100);
  const y = finite(p.y, 50, 0, 100);
  const zoom = finite(p.zoom, 1, 1, 3);
  const rotation = [0, 90, 180, 270].includes(p.rotation ?? 0) ? p.rotation ?? 0 : 0;
  return {
    objectFit: block.scale === 'fill' ? 'fill' : block.scale === 'cover' ? 'cover' : 'contain',
    objectPosition: `${x}% ${y}%`,
    transformOrigin: `${x}% ${y}%`,
    transform: `rotate(${rotation}deg) scale(${p.flipX ? -zoom : zoom}, ${p.flipY ? -zoom : zoom})`,
  };
}
