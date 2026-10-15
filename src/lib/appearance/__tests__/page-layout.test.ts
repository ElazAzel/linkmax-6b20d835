import { describe, expect, it } from 'vitest';
import { BLOCK_SIZE_DIMENSIONS } from '@/types/blocks/base';
import { resolveBlockCellAppearance } from '../block-appearance';
import * as appearance from '../block-appearance';
import { getContrastForeground, getContrastRatio, getPublicPageCssVars } from '../style-utils';

describe('LinkMAX V2 tile contracts', () => {
  it('keeps text readable on the approved bright accent', () => {
    expect(getContrastRatio(getContrastForeground('#0097f2'), '#0097f2')).toBeGreaterThanOrEqual(4.5);
  });

  it('uses the compact V2 shape only when no author shape is set', () => {
    expect((getPublicPageCssVars({}) as Record<string, string>)['--lm-block-radius']).toBe('24px');
    expect((getPublicPageCssVars({ blockShape: 'sharp' }) as Record<string, string>)['--lm-block-radius']).toBe('0px');
  });
  it('resolves tile geometry and gives interactive content its own auto-height row', () => {
    expect(appearance).toHaveProperty('resolveBlockLayout', expect.any(Function));
    const resolve = (appearance as unknown as { resolveBlockLayout: (block: { type: string; blockSize?: string }) => unknown }).resolveBlockLayout;
    expect(resolve({ type: 'image', blockSize: 'xl' })).toMatchObject({ columns: 2, rows: 4, autoHeight: false });
    expect(resolve({ type: 'image', blockSize: 'half' })).toMatchObject({ columns: 1, rows: 1, autoHeight: false });
    expect(resolve({ type: 'form', blockSize: 'small' })).toMatchObject({ columns: 2, rows: 1, autoHeight: true });
    expect(resolve({ type: 'booking', blockSize: 'tall' })).toMatchObject({ columns: 2, rows: 1, autoHeight: true });
    expect(resolve({ type: 'text' })).toMatchObject({ columns: 2, autoHeight: true });
    expect(resolve({ type: 'image', blockSize: 'unknown' })).toMatchObject({ columns: 1, rows: 1 });
  });
  it('supports an XL tile spanning two columns and four rows', () => {
    expect(BLOCK_SIZE_DIMENSIONS).toHaveProperty('xl', { gridCols: 2, gridRows: 4 });
  });

  it('preserves legacy size meanings', () => {
    expect(BLOCK_SIZE_DIMENSIONS.half).toEqual(BLOCK_SIZE_DIMENSIONS.small);
    expect(BLOCK_SIZE_DIMENSIONS.full).toEqual(BLOCK_SIZE_DIMENSIONS.wide);
  });

  it('isolates auto-height content from fixed grid rows while retaining order', () => {
    expect(appearance).toHaveProperty('splitBlockLayoutRuns', expect.any(Function));
    const split = (appearance as unknown as { splitBlockLayoutRuns: (blocks: { id: string; type: string }[]) => { id: string }[][] }).splitBlockLayoutRuns;
    const result = split([
      { id: 'photo', type: 'image' }, { id: 'link', type: 'link' },
      { id: 'form', type: 'form' }, { id: 'faq', type: 'faq' }, { id: 'last', type: 'image' },
    ]);
    expect(result.map(run => run.map(block => block.id))).toEqual([['photo', 'link'], ['form'], ['faq'], ['last']]);
  });

  it('does not add a second frame around a self-styled link', () => {
    const result = resolveBlockCellAppearance({ type: 'link', blockStyle: { shadow: 'lg', borderRadius: 'sm' } });
    expect(result.style.boxShadow).toBeUndefined();
    expect(result.style.borderRadius).toBeUndefined();
  });

  it('honors explicitly disabled padding and borders', () => {
    const result = resolveBlockCellAppearance({ type: 'image', blockStyle: { padding: 'none', borderWidth: 'none' } });
    expect(result.style.padding).toBe('0px');
    expect(result.style.borderWidth).toBe('0px');
  });

  it('retains authored background, shape and text choices', () => {
    const result = resolveBlockCellAppearance({ type: 'image', blockStyle: {
      backgroundColor: '#123456', borderRadius: 'sm', textColor: '#ffffff', padding: 'lg',
    } });
    expect(result.style).toMatchObject({ backgroundColor: '#123456', borderRadius: '10px', color: '#ffffff', padding: '24px' });
  });

  it('composes an adjacent social row with the profile without moving later social blocks', () => {
    expect(appearance).toHaveProperty('resolveProfileComposition', expect.any(Function));
    const resolve = (appearance as unknown as { resolveProfileComposition: (blocks: { id: string; type: string }[]) => { profile?: { id: string }; socials?: { id: string }; content: { id: string }[] } }).resolveProfileComposition;
    const result = resolve([{ id: 'p', type: 'profile' }, { id: 's', type: 'socials' }, { id: 'i', type: 'image' }, { id: 's2', type: 'socials' }]);
    expect(result.profile?.id).toBe('p');
    expect(result.socials?.id).toBe('s');
    expect(result.content.map(block => block.id)).toEqual(['i', 's2']);
  });
});
