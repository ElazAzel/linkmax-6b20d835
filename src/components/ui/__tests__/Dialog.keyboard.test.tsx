import { useState } from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../dialog';

function DialogFixture() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button">Внешний элемент</button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button type="button">Открыть диалог</button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Тестовый диалог</DialogTitle>
            <DialogDescription>Описание диалога</DialogDescription>
          </DialogHeader>
          <button type="button">Действие</button>
        </DialogContent>
      </Dialog>
    </>
  );
}

describe('Dialog keyboard flow', () => {
  it('keeps focus inside modal context and returns focus to trigger on close', async () => {
    render(<DialogFixture />);

    const trigger = screen.getByRole('button', { name: 'Открыть диалог' });
    trigger.focus();

    fireEvent.click(trigger);

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveAttribute('aria-describedby');

    await waitFor(() => {
      expect(document.activeElement).not.toBe(trigger);
    });

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(trigger).toHaveFocus();
    });
  });
});
