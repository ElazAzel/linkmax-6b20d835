import { afterEach, describe, expect, it, vi } from 'vitest';
import { BUSINESS_BLOCK_TYPES, isBusinessDashboardTab, isBusinessFeaturesEnabled, setBusinessFeaturesEnabled } from '../features';
import { sanitizeSlug, slugifyTitle, slugWhileTyping } from '../utils/slug';
import { localizeValidationMessage } from '../blocks/validation-messages';

describe('business features flag', () => {
  afterEach(() => window.localStorage.removeItem('lm-business-features'));

  it('is off by default and can be switched per browser', () => {
    expect(isBusinessFeaturesEnabled()).toBe(false);
    setBusinessFeaturesEnabled(true);
    expect(isBusinessFeaturesEnabled()).toBe(true);
    setBusinessFeaturesEnabled(false);
    expect(isBusinessFeaturesEnabled()).toBe(false);
  });

  it('classifies business blocks and tabs', () => {
    expect(BUSINESS_BLOCK_TYPES.has('booking')).toBe(true);
    expect(BUSINESS_BLOCK_TYPES.has('button')).toBe(false);
    expect(BUSINESS_BLOCK_TYPES.has('event')).toBe(false);
    expect(isBusinessDashboardTab('events')).toBe(false);
    expect(isBusinessDashboardTab('finance')).toBe(true);
    expect(isBusinessDashboardTab('zone-deals')).toBe(true);
    expect(isBusinessDashboardTab('editor')).toBe(false);
  });

  it('can switch business tools for this tab when storage is blocked', () => {
    const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage blocked'); });
    const read = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Storage blocked'); });
    try {
      setBusinessFeaturesEnabled(true);
      expect(isBusinessFeaturesEnabled()).toBe(true);
      setBusinessFeaturesEnabled(false);
      expect(isBusinessFeaturesEnabled()).toBe(false);
    } finally {
      write.mockRestore();
      read.mockRestore();
      setBusinessFeaturesEnabled(false);
    }
  });
});

describe('page address from title', () => {
  it('transliterates Russian and Kazakh titles', () => {
    expect(slugifyTitle('Мастер маникюра')).toBe('master-manikyura');
    expect(slugifyTitle('Қазақ тілі курсы')).toBe('qazaq-tili-kursy');
    expect(slugifyTitle('Ilyas.Studio 2026')).toBe('ilyas-studio-2026');
  });

  it('lets a hyphen be typed and cleans up on submit', () => {
    expect(slugWhileTyping('my-')).toBe('my-');
    expect(sanitizeSlug(slugWhileTyping('my-'))).toBe('my');
  });
});

describe('validation messages', () => {
  const t = ((key: string, fallback?: string | Record<string, unknown>, opts?: Record<string, unknown>) => {
    const text = typeof fallback === 'string' ? fallback : key;
    const vars = (typeof fallback === 'object' ? fallback : opts) ?? {};
    return text.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars[k] ?? ''));
  }) as unknown as Parameters<typeof localizeValidationMessage>[1];

  it('speaks Russian instead of raw validator English', () => {
    expect(localizeValidationMessage('URL is required', t)).toBe('Ссылка: заполните поле');
    expect(localizeValidationMessage('Video URL must be a valid URL', t)).toBe('Ссылка на видео: нужна ссылка, начиная с https://');
  });
});
