import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CoverPositionEditor } from '../CoverPositionEditor';
import { getCoverPositionStyle } from '@/lib/appearance/cover-position';
import { ProfileBlock } from '@/components/blocks/ProfileBlock';
import { coverHeightClass, coverHeightPixels } from '@/lib/profile-shapes';

describe('cover positioning', () => {
  it('scales the preview to the canvas cover ratio inside narrow controls', () => {
    const canvas = document.createElement('div');
    canvas.dataset.blockId = 'profile-canvas';
    canvas.getBoundingClientRect = () => ({ width: 400 } as DOMRect);
    document.body.appendChild(canvas);
    try {
      render(<CoverPositionEditor src="/cover.jpg" blockId="profile-canvas" height="medium" onChange={() => {}} />);
      expect(screen.getByAltText('Положение обложки').parentElement!.style.aspectRatio).toBe('400 / 200');
    } finally { canvas.remove(); }
  });
  it('renders the saved position on the public cover', () => {
    const { container } = render(<ProfileBlock block={{ id: 'profile', type: 'profile', name: 'Test', bio: '', coverImage: '/cover.jpg', coverPosition: { x: 15, y: 80 } }} />);
    expect(container.querySelector('img[src="/cover.jpg"]')).toHaveStyle({ objectPosition: '15% 80%' });
  });
  it('keeps old covers centered and clamps invalid saved positions', () => {
    expect(coverHeightClass('constructor')).toBe('h-[200px]');
    expect(coverHeightPixels('toString')).toBe(200);
    expect(getCoverPositionStyle()).toEqual({ objectPosition: '50% 50%' });
    expect(getCoverPositionStyle(null)).toEqual({ objectPosition: '50% 50%' });
    expect(getCoverPositionStyle({ x: -20, y: 130 })).toEqual({ objectPosition: '0% 100%' });
    expect(getCoverPositionStyle({ x: NaN, y: 25 })).toEqual({ objectPosition: '50% 25%' });
  });

  it('updates a cover with keyboard controls and resets its position', () => {
    const onChange = vi.fn();
    render(<CoverPositionEditor src="/cover.jpg" value={{ x: 20, y: 30 }} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('imagePlacement.y'), { target: { value: '75' } });
    expect(onChange).toHaveBeenLastCalledWith({ x: 20, y: 75 });
    fireEvent.click(screen.getByRole('button', { name: 'imagePlacement.reset' }));
    expect(onChange).toHaveBeenLastCalledWith({ x: 50, y: 50 });
  });

  it('moves the image with a pointer and commits only when dragging finishes', () => {
    const onChange = vi.fn();
    render(<CoverPositionEditor src="/cover.jpg" onChange={onChange} />);
    const image = screen.getByAltText('Положение обложки');
    Object.defineProperties(image, { naturalWidth: { value: 600 }, naturalHeight: { value: 600 } });
    const surface = image.parentElement!;
    surface.getBoundingClientRect = () => ({ width: 300, height: 100 } as DOMRect);
    surface.setPointerCapture = vi.fn();
    surface.releasePointerCapture = vi.fn();
    const pointer = (type: string, props: Record<string, number>) => {
      const event = new Event(type, { bubbles: true });
      Object.entries(props).forEach(([key, value]) => Object.defineProperty(event, key, { value }));
      fireEvent(surface, event);
    };
    pointer('pointerdown', { pointerId: 1, button: 0, clientX: 150, clientY: 50 });
    pointer('pointermove', { pointerId: 1, clientX: 150, clientY: 90 });
    expect(onChange).not.toHaveBeenCalled();
    pointer('pointerup', { pointerId: 1 });
    // 40px down across 200px of overflow moves 50% -> 30%.
    expect(onChange).toHaveBeenCalledWith({ x: 50, y: 30 });
  });
});
