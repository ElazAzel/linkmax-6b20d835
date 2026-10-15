import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AudioBlock } from '../AudioBlock';

describe('AudioBlock', () => {
  it('plays a file with native controls without autoplay and exposes load errors', () => {
    const onClick = vi.fn();
    const { container } = render(<AudioBlock block={{ id: 'a', type: 'audio', title: 'Podcast', fileUrl: 'https://example.com/song.mp3' }} onClick={onClick} />);
    const player = container.querySelector('audio')!;
    expect(player.controls).toBe(true);
    expect(player.autoplay).toBe(false);
    fireEvent.play(player);
    expect(onClick).toHaveBeenCalledOnce();
    fireEvent.error(player);
    expect(screen.getByRole('status')).toHaveTextContent('audioBlock.playbackError');
  });
  it('renders an external music service as a safe card without embedding a player', () => {
    const { container } = render(<AudioBlock block={{ id: 'b', type: 'audio', title: 'Album', sourceType: 'external', externalUrl: 'https://open.spotify.com/album/123' }} />);
    expect(screen.getByRole('link', { name: /Album/ })).toHaveAttribute('rel', 'noopener noreferrer');
    expect(container.querySelector('audio,iframe')).toBeNull();
  });
  it('never passes an unsafe URL to a player or link', () => {
    const { container } = render(<AudioBlock block={{ id: 'c', type: 'audio', title: 'Unsafe', fileUrl: 'javascript:alert(1)' }} />);
    expect(container.querySelector('audio,a')).toBeNull();
  });
});
