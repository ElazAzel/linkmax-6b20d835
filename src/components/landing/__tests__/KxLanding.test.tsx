import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readdirSync } from 'node:fs';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { ClaimForm } from '../kx/primitives';
import { KxHeader } from '../kx/KxHeader';
import uz from '@/i18n/locales/uz.json';

vi.unmock('react-i18next');

const { lookup } = vi.hoisted(() => ({ lookup: vi.fn() }));
vi.mock('@/platform/supabase/client', () => ({
  supabase: { from: () => ({ select: () => ({ eq: () => ({ limit: lookup }) }) }) },
}));

const translations = createInstance();
await translations.use(initReactI18next).init({
  lng: 'ru', fallbackLng: false, resources: { uz: { translation: uz } },
  interpolation: { escapeValue: false },
});

function renderClaim() {
  const submit = vi.fn();
  render(<I18nextProvider i18n={translations}><ClaimForm id="claim" onSubmit={submit} /></I18nextProvider>);
  const input = screen.getByRole('textbox');
  const button = screen.getByRole('button');
  const form = input.closest('form')!;
  return { input, button, form, submit };
}

beforeEach(async () => {
  await translations.changeLanguage('ru');
  vi.useFakeTimers();
  lookup.mockReset().mockResolvedValue({ data: [], error: null });
});

afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('landing address claim', () => {
  const ownedPaths = readdirSync('src/routes', { withFileTypes: true })
    .filter((entry) => entry.name !== 'index.tsx')
    .map((entry) => (entry.isDirectory() ? entry.name : entry.name.replace(/\.(tsx?|jsx?)$/, '')).replace(/\[(.*?)\]/g, '$1'))
    .filter((name) => /^[a-z0-9-]{3,30}$/.test(name));

  it.each(ownedPaths)('does not offer the static route /%s as a profile address', (slug) => {
    const { input, button, form, submit } = renderClaim();
    fireEvent.change(input, { target: { value: slug } });
    expect(button).toBeDisabled();
    expect(screen.getByText('Этот адрес уже занят. Попробуй другой.')).toBeInTheDocument();
    fireEvent.submit(form);
    expect(submit).not.toHaveBeenCalled();
  });

  it('waits for the availability result before allowing submission', async () => {
    let finish!: (result: { data: { slug: string }[]; error: null }) => void;
    lookup.mockReturnValue(new Promise((resolve) => { finish = resolve; }));
    const { input, button, form, submit } = renderClaim();
    fireEvent.change(input, { target: { value: 'aruzhan' } });
    expect(button).toBeDisabled();
    fireEvent.submit(form);
    expect(submit).not.toHaveBeenCalled();
    await act(() => vi.advanceTimersByTimeAsync(450));
    expect(button).toBeDisabled();
    await act(async () => { finish({ data: [], error: null }); });
    expect(button).toBeEnabled();
    fireEvent.submit(form);
    expect(submit).toHaveBeenCalledWith('aruzhan');
  });

  it('keeps a published address blocked after the lookup', async () => {
    lookup.mockResolvedValue({ data: [{ slug: 'aruzhan' }], error: null });
    const { input, button, form, submit } = renderClaim();
    fireEvent.change(input, { target: { value: 'aruzhan' } });
    await act(() => vi.advanceTimersByTimeAsync(450));
    expect(button).toBeDisabled();
    fireEvent.submit(form);
    expect(submit).not.toHaveBeenCalled();
  });
});

it('lets visitors switch from English to Uzbek and renders Uzbek landing copy', async () => {
  await translations.changeLanguage('en');
  render(<I18nextProvider i18n={translations}>
    <KxHeader onLogin={() => {}} onSignup={() => {}} />
    <ClaimForm id="claim" onSubmit={() => {}} />
  </I18nextProvider>);
  await act(async () => { fireEvent.change(screen.getAllByRole('combobox', { name: 'Сменить язык' })[0], { target: { value: 'uz' } }); });
  expect(translations.language).toBe('uz');
  expect(screen.getByRole('button', { name: 'Manzilni olish' })).toBeInTheDocument();
});
