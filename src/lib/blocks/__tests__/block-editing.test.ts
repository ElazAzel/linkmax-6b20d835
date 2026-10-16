import { describe, it, expect } from 'vitest';
import { BLOCK_MANIFEST } from '../block-manifest';
import { createBlock } from '../block-factory';

describe('shared block editing contract', () => {
  it('retains every block and gives each editor explicit tools, sizes and validation', () => {
    expect(Object.keys(BLOCK_MANIFEST)).toHaveLength(31);
    for (const entry of Object.values(BLOCK_MANIFEST)) {
      expect(createBlock(entry.type).type).toBe(entry.type);
      expect(entry.editing.tools).toContain('appearance');
      expect(entry.editing.allowedSizes.length).toBeGreaterThan(0);
      expect(typeof entry.editing.validate).toBe('function');
    }
  });
  it('offers tile sizes to images and preserves full-width form usability', () => {
    expect(BLOCK_MANIFEST.image.editing.allowedSizes).toContain('xl');
    expect(BLOCK_MANIFEST.image.editing.tools).toContain('image');
    expect(BLOCK_MANIFEST.form.editing.allowedSizes).toEqual(['full']);
    expect(BLOCK_MANIFEST.form.editing.tools).not.toContain('size');
  });
  it('reuses actual link validation and rejects an unsafe audio URL', () => {
    expect(BLOCK_MANIFEST.link.editing.validate({title:'Visit',url:''})).toBeTruthy();
    expect(BLOCK_MANIFEST.audio.editing.validate({sourceType:'file',fileUrl:'javascript:alert(1)'})).toBe('audioBlock.invalidUrl');
    expect(BLOCK_MANIFEST.audio.editing.validate({sourceType:'external',externalUrl:'https://music.example/album'})).toBeNull();
  });
  it('accepts local image assets while rejecting unsafe media schemes', () => {
    expect(BLOCK_MANIFEST.image.editing.validate({url:'/og-experts.jpg',alt:'Cover'})).toBeNull();
    expect(BLOCK_MANIFEST.image.editing.validate({url:'javascript:alert(1)',alt:'Cover'})).toBeTruthy();
    expect(BLOCK_MANIFEST.image.editing.validate({url:'//untrusted.example/image.jpg',alt:'Cover'})).toBeTruthy();
    expect(BLOCK_MANIFEST.image.editing.validate({url:'/\\untrusted.example/image.jpg',alt:'Cover'})).toBeTruthy();
  });
});
