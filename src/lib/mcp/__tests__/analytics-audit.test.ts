import { describe, expect, it } from 'vitest';
import { summarizePageAnalytics, type AnalyticsRow } from '../page-analytics';
import { auditPage } from '../audit';
import type { DraftSnapshot } from '../draft';

const now = new Date().toISOString();
const view = (visitor: string, extra: Record<string, unknown> = {}): AnalyticsRow => ({ event_type: 'view', block_id: null, metadata: { visitorId: visitor, source: 'instagram', device: 'mobile', ...extra }, created_at: now });
const click = (blockId: string): AnalyticsRow => ({ event_type: 'click', block_id: null, metadata: { blockId }, created_at: now });

describe('summarizePageAnalytics', () => {
  it('separates page views from block impressions and maps clicks by content id', () => {
    const summary = summarizePageAnalytics({
      days: 7,
      events: [view('a'), view('b'), view('a'), view('a', { isBlockImpression: true, blockId: 'btn-1' }), click('btn-1')],
      previous: [view('x')],
      blocks: [{ id: 'db-uuid', type: 'button', content: { id: 'btn-1', title: 'Записаться' } }],
      leads: 1,
      sampled: false,
    });
    expect(summary.views).toBe(3);
    expect(summary.unique_visitors).toBe(2);
    expect(summary.blocks[0]).toMatchObject({ block_id: 'btn-1', label: 'Записаться', clicks: 1, impressions: 1, ctr_percent: 100 });
    expect(summary.change_vs_previous.views_percent).toBe(200);
    expect(summary.sources[0]).toEqual({ source: 'instagram', views: 3 });
    expect(summary.daily).toHaveLength(7);
  });
});

describe('auditPage', () => {
  const weakPage: DraftSnapshot = { id: 'p', blocks: [{ id: 'link-1', type: 'link', title: 'Site', url: 'https://x.kz' }] };
  const goodPage: DraftSnapshot = {
    id: 'p',
    city: 'Алматы',
    seo: { description: 'Маникюр и брови в Алматы: запись онлайн, стерильные инструменты, работа с 2018 года.' },
    blocks: [
      { id: 'profile-1', type: 'profile', name: 'Айгерим', bio: 'Мастер маникюра в Алматы: аккуратно, стерильно, держится три недели.', avatar: 'https://x/a.jpg', coverImage: 'https://x/c.jpg' },
      { id: 'messenger-1', type: 'messenger', messengers: [{ platform: 'whatsapp', username: '77001234567' }] },
      { id: 'pricing-1', type: 'pricing', items: [{ name: 'Маникюр', price: 8000 }] },
      { id: 'faq-1', type: 'faq', items: [{ question: 'Q', answer: 'A' }] },
    ],
  };

  it('flags a page without profile, contact or offer as weak, worst first', () => {
    const report = auditPage({ snapshot: weakPage, isPublished: false, hasUnpublishedChanges: false });
    expect(report.weaknesses[0].severity).toBe('high');
    expect(report.weaknesses.map((w) => w.code)).toEqual(expect.arrayContaining(['no_profile', 'no_contact', 'not_published', 'no_offer']));
    expect(report.score).toBeLessThan(40);
    expect(report.next_steps).toHaveLength(3);
  });

  it('credits a complete page and uses analytics evidence', () => {
    const analytics = summarizePageAnalytics({
      days: 30,
      events: Array.from({ length: 40 }, (_, i) => view(`v${i}`)),
      previous: [], blocks: [], leads: 0, sampled: false,
    });
    const report = auditPage({ snapshot: goodPage, isPublished: true, hasUnpublishedChanges: false, analytics });
    expect(report.strengths.map((s) => s.code)).toEqual(expect.arrayContaining(['clear_bio', 'contact_path', 'clear_offer', 'faq', 'share_image']));
    expect(report.weaknesses.map((w) => w.code)).toContain('low_ctr');
    expect(report.score).toBeGreaterThan(60);
  });
});
