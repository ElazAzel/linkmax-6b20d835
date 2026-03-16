import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BlockInsertButton } from '@/components/editor/BlockInsertButton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { renderWithProviders } from '@/testing/test-utils';

vi.mock('@/hooks/ui/use-mobile', () => ({
  useIsMobile: () => false,
}));

describe('BlockInsertButton a11y', () => {
  it('renders add-block trigger as native button', () => {
    renderWithProviders(<BlockInsertButton onInsert={vi.fn()} />);

    const trigger = screen.getByRole('button');
    expect(trigger).toBeInTheDocument();
    expect(trigger.tagName).toBe('BUTTON');
  });
});

describe('DialogContent a11y', () => {
  it('traps focus and restores it to trigger after close', async () => {
    render(
      <div>
        <Dialog>
          <DialogTrigger asChild>
            <button type="button">Open dialog</button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>Dialog title</DialogTitle>
            <DialogDescription>Dialog description</DialogDescription>
            <button type="button">First action</button>
            <button type="button">Second action</button>
          </DialogContent>
        </Dialog>
        <button type="button">Outside focus</button>
      </div>
    );

    const trigger = screen.getByRole('button', { name: 'Open dialog' });
    fireEvent.click(trigger);

    const content = await screen.findByRole('dialog');
    expect(content).toContainElement(document.activeElement as HTMLElement);

    const outside = screen.getByText('Outside focus', { selector: 'button' });
    outside.focus();

    await waitFor(() => {
      expect(content).toContainElement(document.activeElement);
    });

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(trigger).toHaveFocus();
    });
  });
});

describe('SheetContent a11y', () => {
  it('traps focus and restores it to trigger after close', async () => {
    render(
      <div>
        <Sheet>
          <SheetTrigger asChild>
            <button type="button">Open sheet</button>
          </SheetTrigger>
          <SheetContent>
            <SheetTitle>Sheet title</SheetTitle>
            <SheetDescription>Sheet description</SheetDescription>
            <button type="button">Primary action</button>
            <button type="button">Secondary action</button>
          </SheetContent>
        </Sheet>
        <button type="button">Sheet outside focus</button>
      </div>
    );

    const trigger = screen.getByRole('button', { name: 'Open sheet' });
    fireEvent.click(trigger);

    const content = await screen.findByRole('dialog');
    expect(content).toContainElement(document.activeElement);

    const outside = screen.getByText('Sheet outside focus', { selector: 'button' });
    outside.focus();

    await waitFor(() => {
      expect(content).toContainElement(document.activeElement);
    });

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(trigger).toHaveFocus();
    });
  });
});
