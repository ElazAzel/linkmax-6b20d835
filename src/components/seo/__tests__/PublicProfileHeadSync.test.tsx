import { render } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import type { Block, PageData } from '@/types/page';
import { PublicProfileHeadSync } from '../PublicProfileHeadSync';
import { normalizeSeoLanguage } from '@/lib/seo/public-page-seo';

const state = vi.hoisted(() => ({ language: 'ru', updateMatch: vi.fn() }));
const router = { updateMatch: state.updateMatch };
vi.mock('@tanstack/react-router', () => ({ useRouter: () => router }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ i18n: { language: state.language } }) }));

it('updates the route title, locale and JSON-LD after a language switch', () => {
  const page = { slug: 'alice', theme: {}, seo: {}, blocks: [
    { id: 'profile', type: 'profile', name: { ru: 'Алиса', en: 'Alice', kk: 'Әлия' }, bio: { ru: 'Дизайнер', en: 'Designer', kk: 'Дизайнер' } },
  ] as unknown as Block[] } as PageData;
  const { rerender } = render(<PublicProfileHeadSync page={page} matchId="alice" />);
  state.language = 'en';
  rerender(<PublicProfileHeadSync page={page} matchId="alice" />);
  const [id, update] = state.updateMatch.mock.calls.at(-1)!;
  const head = update({});
  expect(id).toBe('alice');
  expect(head.meta).toContainEqual({ property: 'og:locale', content: 'en_US' });
  expect(head.meta.find((meta: Record<string, string>) => meta.title)?.title).toContain('Alice');
  expect(head.headScripts[0].children).toContain('"inLanguage":"en"');
  state.language = 'kk';
  rerender(<PublicProfileHeadSync page={page} matchId="alice" />);
  const kazakh = state.updateMatch.mock.calls.at(-1)![1]({});
  expect(kazakh.meta).toContainEqual({ property: 'og:locale', content: 'kk_KZ' });
});

it('normalizes supported request locale aliases and rejects unknown values', () => {
  expect(normalizeSeoLanguage('en-US')).toBe('en');
  expect(normalizeSeoLanguage('kz')).toBe('kk');
  expect(normalizeSeoLanguage({})).toBe('ru');
});
