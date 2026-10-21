import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { ProfileBlock } from '@/components/blocks/ProfileBlock';
import { AvatarBlock } from '@/components/blocks/AvatarBlock';

afterEach(cleanup);

describe('standard avatar shape on old pages', () => {
  it.each(['squircle', 'hexagon', 'blob', 'sticker'] as const)('renders a saved %s profile as a circle in the current layout', avatarShape => {
    const { container } = render(<ProfileBlock block={{ id: 'old-profile', type: 'profile', name: 'Avatar Example', bio: '', avatarShape }} />);
    expect(container.querySelector('.lm-profile-avatar > div')).toHaveStyle({ borderRadius: '9999px' });
    expect(screen.getByText('AE').parentElement).toHaveStyle({ borderRadius: '9999px' });
  });

  it('also normalizes a standalone legacy avatar without changing its image', () => {
    render(<AvatarBlock block={{ id: 'old-avatar', type: 'avatar', name: 'Avatar Example', subtitle: '', imageUrl: '/original.jpg', shape: 'square' }} />);
    expect(screen.getByText('AE').parentElement).toHaveClass('rounded-full');
  });
});
