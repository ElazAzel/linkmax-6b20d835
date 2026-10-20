import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DateTimeInput } from './DateTimeInput';

describe('DateTimeInput', () => {
  it('keeps an incomplete native draft through parent rerenders and clears on blur', () => {
    const onValueChange = vi.fn();
    const props = { value: '2026-10-20T10:30:00Z', timeZone: 'Asia/Almaty', onValueChange };
    const { rerender } = render(<DateTimeInput aria-label="Date" {...props} />);
    const input = screen.getByLabelText('Date') as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '' } });
    expect(onValueChange).not.toHaveBeenCalled();
    rerender(<DateTimeInput aria-label="Date" {...props} />);
    expect(input.value).toBe('');
    fireEvent.blur(input);
    expect(onValueChange).toHaveBeenCalledWith('');
  });
  it('commits valid edits as instants and responds to external changes', () => {
    const onValueChange = vi.fn();
    const { rerender } = render(<DateTimeInput aria-label="Date" timeZone="Asia/Almaty" onValueChange={onValueChange} />);
    const input = screen.getByLabelText('Date') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '2026-10-20T15:30' } });
    expect(onValueChange).toHaveBeenCalledWith('2026-10-20T10:30:00.000Z');
    rerender(<DateTimeInput aria-label="Date" value="2026-10-21T10:30:00Z" timeZone="Asia/Almaty" onValueChange={onValueChange} />);
    expect(input.value).toBe('2026-10-21T15:30');
  });
});
