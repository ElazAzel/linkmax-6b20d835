import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { changeLanguageLoaded } = vi.hoisted(() => ({ changeLanguageLoaded: vi.fn(() => Promise.resolve()) }));

vi.mock('@/i18n/config', () => ({ changeLanguageLoaded }));
vi.mock('@/pages/Index', () => ({ default: () => <main>landing</main> }));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ i18n: { language: 'ru' } }) }));

import LocaleIndex from '../LocaleIndex';

describe('LocaleIndex', () => {
  beforeEach(() => changeLanguageLoaded.mockClear());

  it('renders the landing in the locale of the route', async () => {
    render(<LocaleIndex lang="en" />);

    expect(screen.getByText('landing')).toBeInTheDocument();
    await waitFor(() => expect(changeLanguageLoaded).toHaveBeenCalledWith('en'));
  });

  it('keeps the current language when it already matches', () => {
    render(<LocaleIndex lang="ru" />);

    expect(screen.getByText('landing')).toBeInTheDocument();
    expect(changeLanguageLoaded).not.toHaveBeenCalled();
  });
});
