import { describe, expect, it } from 'vitest';
import { getAcceptedMediaTypes, isGifUpload } from '../MediaUpload';

describe('MediaUpload GIF handling', () => {
  it('adds explicit GIF picker support for image fields', () => {
    expect(getAcceptedMediaTypes('image/*', true)).toBe('image/*,image/gif,.gif');
  });

  it('does not duplicate GIF picker support when it is already present', () => {
    expect(getAcceptedMediaTypes('image/png,image/gif,.gif', true)).toBe('image/png,image/gif,.gif');
  });

  it('detects GIF files even when the browser omits the MIME type', () => {
    expect(isGifUpload({ type: '', name: 'animated-banner.GIF' })).toBe(true);
  });
});
