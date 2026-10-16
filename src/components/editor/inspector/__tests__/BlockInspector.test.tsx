import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BlockInspector } from '../BlockInspector';
import type { Block } from '@/types/page';

const button = { id: 'b1', type: 'button', title: 'Записаться', url: 'https://example.com' } as unknown as Block;

describe('BlockInspector', () => {
  it('shows a hint with actions when no block is selected (docked)', () => {
    const onAddBlock = vi.fn();
    render(
      <BlockInspector mode="docked" block={null} onUpdateBlock={vi.fn()} onClose={vi.fn()} onAddBlock={onAddBlock} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /Добавить блок/ }));
    expect(onAddBlock).toHaveBeenCalled();
  });

  it('renders nothing in sheet mode without a block', () => {
    const { container } = render(
      <BlockInspector mode="sheet" block={null} onUpdateBlock={vi.fn()} onClose={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('opens the block editor and discards changes back to the opened state', async () => {
    vi.useFakeTimers();
    const onUpdateBlock = vi.fn();
    const { unmount } = render(<BlockInspector mode="docked" block={button} onUpdateBlock={onUpdateBlock} onClose={vi.fn()} />);
    try {
      const discard = screen.getByRole('button', { name: /Отменить изменения/ });
      expect(discard).toBeDisabled();

      fireEvent.click(screen.getByRole('button', { name: 'S 2×1' }));
      expect(discard).toBeEnabled();
      expect(onUpdateBlock).not.toHaveBeenCalled();

      // Drive the preview deadline explicitly, independent of CI scheduling.
      await act(async () => { await vi.advanceTimersByTimeAsync(200); });
      expect(onUpdateBlock).toHaveBeenCalledExactlyOnceWith('b1', expect.objectContaining({ blockSize: 'wide' }));

      fireEvent.click(discard);
      const revert = onUpdateBlock.mock.calls.at(-1)?.[1] as Record<string, unknown>;
      expect(revert.title).toBe('Записаться');
      expect('blockSize' in revert && revert.blockSize === undefined).toBe(true);
    } finally {
      unmount();
      vi.useRealTimers();
    }
  });

  it('shows the next block translation when switching directly between blocks', async () => {
    const props = { mode: 'docked' as const, onUpdateBlock: vi.fn(), onClose: vi.fn() };
    const first = { ...button, title: { ru: 'Russian A' } } as unknown as Block;
    const second = { ...button, id: 'b2', title: { en: 'English B' } } as unknown as Block;
    const { rerender } = render(<BlockInspector {...props} block={first} />);
    await act(async () => { await vi.dynamicImportSettled(); });
    expect(await screen.findByDisplayValue('Russian A')).toHaveValue('Russian A');
    rerender(<BlockInspector {...props} block={second} />);
    expect(await screen.findByDisplayValue('English B')).toHaveValue('English B');
    expect(screen.queryByDisplayValue('Russian A')).not.toBeInTheDocument();
  });

  it('closes via Готово', () => {
    const onClose = vi.fn();
    render(<BlockInspector mode="docked" block={button} onUpdateBlock={vi.fn()} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /Готово/ }));
    expect(onClose).toHaveBeenCalled();
  });

  it('offers the XL tile preset through the existing draft editor', async () => {
    const onUpdateBlock = vi.fn();
    render(<BlockInspector mode="docked" block={button} onUpdateBlock={onUpdateBlock} onClose={vi.fn()} />);
    fireEvent.click(await screen.findByRole('button', { name: 'XL 2×4' }));
    fireEvent.click(screen.getByRole('button', { name: /Готово/ }));
    await waitFor(() => expect(onUpdateBlock).toHaveBeenCalledWith('b1', expect.objectContaining({ blockSize: 'xl' })));
  });
});
