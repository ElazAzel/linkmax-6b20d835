import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { CreatePageDialog } from '../CreatePageDialog';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
    i18n: { language: 'en' },
  }),
}));

describe('CreatePageDialog', () => {
  it('shows fallback error and resets loading when onCreatePage rejects', async () => {
    const onCreatePage = vi.fn().mockRejectedValue(new Error('network offline'));

    render(
      <CreatePageDialog
        open
        onOpenChange={vi.fn()}
        limits={{ canCreate: true, currentPages: 0, maxPages: 1 }}
        isPremium={false}
        onCreatePage={onCreatePage}
        onUpgrade={vi.fn()}
      />,
    );

    fireEvent.change(screen.getByLabelText('Page title'), {
      target: { value: 'Landing page' },
    });

    const submitButton = screen.getByRole('button', { name: 'Create page' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onCreatePage).toHaveBeenCalledWith('Landing page', undefined);
    });

    expect(await screen.findByText('Failed to create page')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Create page' })).toBeEnabled();
    });
  });
});
