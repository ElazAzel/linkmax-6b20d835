import { fireEvent, render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MultilingualInput } from '../MultilingualInput';

describe('multilingual input accessibility', () => {
  it('keeps language removal outside native tab buttons', () => {
    const { container } = render(<MultilingualInput value={{ ru: 'Привет', en: 'Hello' }} onChange={vi.fn()} label="Title" primaryLanguage="ru" />);
    expect(container.querySelector('button button')).toBeNull();
  });
  it('removes the selected optional language while preserving the primary translation', () => {
    const onChange = vi.fn();
    render(<MultilingualInput value={{ ru: 'Привет', en: 'Hello' }} onChange={onChange} label="Title" primaryLanguage="ru" />);
    fireEvent.mouseDown(screen.getByRole('tab', { name: /English/ }), {button:0,ctrlKey:false});
    const remove = screen.getByRole('button', { name: /Удалить.*English|Delete.*English/ });
    fireEvent.click(remove);
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ ru: 'Привет' }));
    expect(onChange.mock.calls.at(-1)?.[0]).not.toHaveProperty('en');
  });
});
