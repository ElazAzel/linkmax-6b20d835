import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DynamicIslandNav } from '@/components/landing/v2/DynamicIslandNav';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback?: string) => fallback ?? _key }),
}));

vi.mock('@/hooks/ui/use-mobile', () => ({ useIsMobile: () => false }));
vi.mock('@/components/translation/LanguageSwitcher', () => ({ LanguageSwitcher: () => <span>language</span> }));

describe('DynamicIslandNav revenue navigation', () => {
  it('links to the new client-journey sections', () => {
    render(<DynamicIslandNav onLogin={vi.fn()} onSignup={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Результат' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Как работает' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Для кого' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Тарифы' })).toBeInTheDocument();
  });
});
