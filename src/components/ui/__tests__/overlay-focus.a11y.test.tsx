import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '../dialog';
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from '../sheet';

function DialogHarness() {
  return (
    <Dialog>
      <DialogTrigger>Open dialog</DialogTrigger>
      <DialogContent>
        <DialogTitle>Dialog title</DialogTitle>
        <DialogDescription>Dialog description</DialogDescription>
        <button type="button">Dialog action</button>
      </DialogContent>
    </Dialog>
  );
}

function SheetHarness() {
  return (
    <Sheet>
      <SheetTrigger>Open sheet</SheetTrigger>
      <SheetContent>
        <SheetTitle>Sheet title</SheetTitle>
        <SheetDescription>Sheet description</SheetDescription>
        <button type="button">Sheet action</button>
      </SheetContent>
    </Sheet>
  );
}

describe('DialogContent and SheetContent a11y focus behavior', () => {
  it('returns focus to dialog trigger when closed with Escape', async () => {
    render(<DialogHarness />);
    const trigger = screen.getByRole('button', { name: 'Open dialog' });

    fireEvent.click(trigger);
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(document.activeElement).toBe(trigger);
    });
  });

  it('keeps keyboard navigation inside sheet and restores trigger focus on close', async () => {
    render(<SheetHarness />);
    const trigger = screen.getByRole('button', { name: 'Open sheet' });

    fireEvent.click(trigger);
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();

    const action = screen.getByRole('button', { name: 'Sheet action' });
    action.focus();
    fireEvent.keyDown(action, { key: 'Tab' });

    const closeButton = screen.getByRole('button', { name: /close/i });
    expect(document.activeElement === action || document.activeElement === closeButton).toBe(true);

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });
});
