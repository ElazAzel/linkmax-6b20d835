import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
    const onUpdateBlock = vi.fn();
    render(<BlockInspector mode="docked" block={button} onUpdateBlock={onUpdateBlock} onClose={vi.fn()} />);

    const discard = screen.getByRole('button', { name: /Отменить изменения/ });
    expect(discard).toBeDisabled();

    // Size selector in the header edits the block through the same draft.
    const sizeButtons = (await screen.findAllByRole('button')).filter((b) => b.className.includes('h-8 w-8'));
    fireEvent.click(sizeButtons[1]); // 2×1

    await waitFor(() => expect(onUpdateBlock).toHaveBeenCalledWith('b1', expect.objectContaining({ blockSize: 'wide' })));
    expect(discard).toBeEnabled();

    fireEvent.click(discard);
    const revert = onUpdateBlock.mock.calls.at(-1)?.[1] as Record<string, unknown>;
    expect(revert.title).toBe('Записаться');
    expect('blockSize' in revert && revert.blockSize === undefined).toBe(true);
  });

  it('closes via Готово', () => {
    const onClose = vi.fn();
    render(<BlockInspector mode="docked" block={button} onUpdateBlock={vi.fn()} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /Готово/ }));
    expect(onClose).toHaveBeenCalled();
  });
});
