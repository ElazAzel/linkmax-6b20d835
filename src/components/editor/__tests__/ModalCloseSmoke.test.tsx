import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { BlockInsertButton } from '../BlockInsertButton';
import { StructureView } from '../StructureView';
import { MobileBlockActions } from '../MobileBlockActions';
import type { Block } from '@/types/page';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, fallback?: string) => fallback ?? _key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('@/hooks/ui/use-mobile', () => ({
  useIsMobile: () => false,
}));

vi.mock('@/hooks/ui/useHapticFeedback', () => ({
  useHapticFeedback: () => ({
    warning: vi.fn(),
    mediumTap: vi.fn(),
    lightTap: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock('sonner', () => ({
  toast: { error: vi.fn() },
}));

vi.mock('@/lib/utils/icon-utils', () => ({
  getLucideIcon: () => () => <span data-testid="mock-icon" />,
}));

const getOverlay = () => document.querySelector('[data-state="open"].fixed.inset-0');

describe('editor modal close smoke tests', () => {
  it('BlockInsertButton closes via close button, ESC and overlay', async () => {
    const onOpenChange = vi.fn();

    render(
      <BlockInsertButton
        onInsert={vi.fn()}
        isOpen
        onOpenChange={onOpenChange}
      />
    );

    expect(screen.getAllByLabelText(/close|закрыть/i)).toHaveLength(1);

    fireEvent.click(screen.getByLabelText(/close|закрыть/i));
    expect(onOpenChange).toHaveBeenCalledWith(false);

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));

    const overlay = getOverlay();
    expect(overlay).toBeTruthy();
    if (overlay) {
      fireEvent.pointerDown(overlay);
      fireEvent.click(overlay);
    }

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it('StructureView closes via close button, ESC and overlay', async () => {
    const onOpenChange = vi.fn();

    render(
      <StructureView
        open
        onOpenChange={onOpenChange}
        blocks={[{ id: 'profile-1', type: 'profile' } as unknown as Block]}
        onBlockSelect={vi.fn()}
      />
    );

    expect(screen.getAllByLabelText(/close|закрыть/i)).toHaveLength(1);

    fireEvent.click(screen.getByLabelText(/close|закрыть/i));
    expect(onOpenChange).toHaveBeenCalledWith(false);

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));

    const overlay = getOverlay();
    expect(overlay).toBeTruthy();
    if (overlay) {
      fireEvent.pointerDown(overlay);
      fireEvent.click(overlay);
    }

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it('MobileBlockActions closes via close button, ESC and overlay', async () => {
    const onOpenChange = vi.fn();

    render(
      <MobileBlockActions
        block={{ id: 'link-1', type: 'link' } as unknown as Block}
        open
        onOpenChange={onOpenChange}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getAllByLabelText(/close|закрыть/i)).toHaveLength(1);

    fireEvent.click(screen.getByLabelText(/close|закрыть/i));
    expect(onOpenChange).toHaveBeenCalledWith(false);

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));

    const overlay = getOverlay();
    expect(overlay).toBeTruthy();
    if (overlay) {
      fireEvent.pointerDown(overlay);
      fireEvent.click(overlay);
    }

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });
});
