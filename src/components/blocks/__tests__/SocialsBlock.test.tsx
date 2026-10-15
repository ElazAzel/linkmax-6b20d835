import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SocialsBlock } from '../SocialsBlock';

describe('SocialsBlock platform compatibility', () => {
  it('renders recognizable icons and names from platform records when icon is absent', () => {
    render(<SocialsBlock block={{ id: 's', type: 'socials', platforms: [
      { platform: 'telegram', url: 'https://example.com/telegram' },
      { platform: 'instagram', url: 'https://example.com/instagram' },
      { platform: 'youtube', url: 'https://example.com/youtube' },
    ] }} />);
    expect(screen.getByRole('button', { name: 'telegram' }).querySelector('svg.lucide-send')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'instagram' }).querySelector('svg.lucide-instagram')).not.toBeNull();
    expect(screen.getByRole('button', { name: 'youtube' }).querySelector('svg.lucide-youtube')).not.toBeNull();
  });

  it('keeps an explicit icon and author name ahead of a platform default', () => {
    render(<SocialsBlock block={{ id: 's', type: 'socials', platforms: [{ platform: 'telegram', icon: 'mail', name: 'Contact', url: 'mailto:hello@example.com' }] }} />);
    expect(screen.getByRole('button', { name: 'Contact' }).querySelector('svg.lucide-mail')).not.toBeNull();
  });

  it('keeps author colors and shape on social controls', () => {
    render(<SocialsBlock block={{ id: 's', type: 'socials', blockStyle: { textColor: '#ffcc00', backgroundColor: '#123456', borderRadius: 'sm' }, platforms: [{ icon: 'mail', url: 'mailto:hello@example.com' }] }} />);
    expect(screen.getByRole('button', { name: 'mail' })).toHaveStyle({ color: '#ffcc00', backgroundColor: '#123456', borderRadius: '10px' });
  });
});
