import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildLeadInsert, DEFAULT_LEAD_NAME } from '../../../../supabase/functions/_shared/lead-insert';
import type { Database } from '@/integrations/supabase/types';

type LeadInsert = Database['public']['Tables']['leads']['Insert'];

const base = {
  ownerId: '5e6d27a8-f64b-4297-8352-de2e29b9d762',
  pageId: '409d33c7-8549-4972-9b6c-11fba0aed39d',
  blockId: 'form-1',
  metadata: { utm_source: 'instagram' },
};

describe('buildLeadInsert (submit-lead)', () => {
  it('fills required live columns and keeps page/block/form data in metadata', () => {
    const row = buildLeadInsert({
      ...base,
      formData: { 'Имя': 'Динара', 'Телефон': '+7 701 234 56 78', 'Email': 'd@example.kz', 'Услуга': 'Маникюр' },
    });
    expect(row).toMatchObject({
      user_id: base.ownerId,
      name: 'Динара',
      phone: '+7 701 234 56 78',
      email: 'd@example.kz',
      source: 'form',
      status: 'new',
    });
    expect(row.metadata).toMatchObject({
      utm_source: 'instagram',
      page_id: base.pageId,
      block_id: 'form-1',
      form_data: { 'Услуга': 'Маникюр' },
    });
  });

  it('falls back to a readable name when the form has no name field', () => {
    const row = buildLeadInsert({ ...base, formData: { question: 'Есть окно в субботу?' } });
    expect(row.name).toBe(DEFAULT_LEAD_NAME);
    expect(row.email).toBeNull();
    expect(row.phone).toBeNull();
  });

  it('only uses columns that exist on the live leads table', () => {
    const row = buildLeadInsert({ ...base, formData: { name: 'A' } });
    // Compile-time: the row must be assignable to the generated Insert type.
    const typed: LeadInsert = row;
    const liveColumns = new Set(['user_id', 'name', 'email', 'phone', 'source', 'status', 'metadata']);
    expect(Object.keys(typed).every((key) => liveColumns.has(key))).toBe(true);
  });

  it('submit-lead no longer selects pages.content or inserts removed columns', () => {
    const source = readFileSync(resolve(process.cwd(), 'supabase/functions/submit-lead/index.ts'), 'utf8');
    expect(source).not.toMatch(/select\('[^']*\bcontent\b[^']*'\)[\s\S]{0,40}\.eq\('id', pageId\)/);
    expect(source).toContain('buildLeadInsert(');
    expect(source).not.toMatch(/insert\(\{\s*page_id:/);
  });
});
