import { describe, it, expect } from 'vitest';
import { getImagePlacementStyle } from '../image-placement';

describe('image placement', () => {
  it('keeps legacy images entirely visible unless the author chooses cropping', () => {
    expect(getImagePlacementStyle({})).toMatchObject({ objectFit: 'cover', objectPosition: '50% 50%' });
    expect(getImagePlacementStyle({ scale: 'contain' }).objectFit).toBe('cover');
    expect(getImagePlacementStyle({ scale: 'cover' }).objectFit).toBe('cover');
  });
  it('combines non-destructive crop, position, rotation and reflection', () => {
    expect(getImagePlacementStyle({ imagePlacement: { x: 25, y: 75, zoom: 2, rotation: 90, flipX: true } })).toMatchObject({ objectPosition: '25% 75%', transform: 'rotate(90deg) scale(-2, 2)' });
  });
  it('clamps invalid persisted values without injecting arbitrary CSS', () => {
    const result = getImagePlacementStyle({ imagePlacement: { x: -300, y: 900, zoom: NaN, rotation: 123 } });
    expect(result).toMatchObject({ objectPosition: '0% 100%', transform: 'rotate(0deg) scale(1, 1)' });
  });
});
