import { describe, expect, it } from 'vitest';
import { preserveBuilderIdentity } from './smart-page-builder';
import type { Block } from '@/types/page';

const ownerProfile = {
  id: 'owner-profile',
  type: 'profile',
  name: 'Алия',
  bio: 'Мастер маникюра',
  avatar: 'https://cdn.example.com/owner.jpg',
  verified: true,
  badges: [{ id: 'b1', kind: 'custom', label: 'Топ мастер' }],
  avatarFrame: 'gold',
  shadowStyle: 'glow',
  nameAnimation: 'sparkle',
} as unknown as Block;

const templateProfile = {
  id: 'tpl-profile',
  type: 'profile',
  name: 'Демо',
  bio: 'Демо био',
  avatar: 'https://cdn.example.com/demo-seller.jpg',
  verified: false,
  badges: [{ id: 'example', kind: 'custom', label: 'Демо-шаблон' }],
  avatarFrame: 'default',
  shadowStyle: 'none',
  nameAnimation: 'none',
  introVideo: 'https://cdn.example.com/intro.mp4',
} as unknown as Block;

describe('preserveBuilderIdentity', () => {
  it('never lets a template overwrite the owner identity (badge, verification, avatar, intro)', () => {
    const result = preserveBuilderIdentity([templateProfile], [ownerProfile]);
    const profile = result[0];
    expect(profile).toMatchObject({
      id: 'owner-profile',
      avatar: 'https://cdn.example.com/owner.jpg',
      verified: true,
      badges: [{ id: 'b1', kind: 'custom', label: 'Топ мастер' }],
    });
    expect(JSON.stringify(profile)).not.toContain('Демо-шаблон');
    expect(JSON.stringify(profile)).not.toContain('demo-seller');
    expect(JSON.stringify(profile)).not.toContain('intro.mp4');
  });

  it('keeps the owner header styling and only fills gaps from the template', () => {
    const result = preserveBuilderIdentity([templateProfile], [ownerProfile]);
    expect(result[0]).toMatchObject({ avatarFrame: 'gold', shadowStyle: 'glow', nameAnimation: 'sparkle' });

    const bareOwner = { ...ownerProfile, avatarFrame: undefined, shadowStyle: undefined } as Block;
    const filled = preserveBuilderIdentity([templateProfile], [bareOwner]);
    expect(filled[0]).toMatchObject({ avatarFrame: 'default', shadowStyle: 'none' });
  });

  it('does not adopt the template avatar when the owner has none', () => {
    const noAvatar = { ...ownerProfile, avatar: '' } as Block;
    const result = preserveBuilderIdentity([templateProfile], [noAvatar]);
    expect((result[0] as { avatar?: string }).avatar).toBe('');
  });

  it('keeps the owner name and bio when keepText is set', () => {
    const result = preserveBuilderIdentity([templateProfile], [ownerProfile], true);
    expect(result[0]).toMatchObject({ name: 'Алия', bio: 'Мастер маникюра' });
  });

  it('leaves pages without a profile block untouched', () => {
    const link = { id: 'l1', type: 'link', title: 'Site', url: 'https://example.com' } as unknown as Block;
    expect(preserveBuilderIdentity([link], [link])).toEqual([link]);
  });
});
