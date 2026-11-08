import { describe, expect, it } from 'vitest';

import { buildLeadInsert } from '../../../../supabase/functions/_shared/lead-insert';
import { getLeadAttribution, getLeadFields, getLeadPreview, humanizeLeadKey } from '../lead-form-data';

// What submit-lead stores for a FormBlock submission: every top-level value is
// stringified, so absent UTM tags arrive as "null".
const formLeadMetadata = buildLeadInsert({
  ownerId: '5e6d27a8-f64b-4297-8352-de2e29b9d762',
  pageId: '409d33c7-8549-4972-9b6c-11fba0aed39d',
  blockId: 'form-1',
  formData: { 'Имя': 'Айгерим', 'Телефон': '+77015551020', 'Сообщение': 'Хочу записаться\nв субботу утром' },
  metadata: {
    utm_source: 'null', utm_medium: 'null', utm_campaign: 'null', utm_term: 'null', utm_content: 'null',
    referrer: 'direct', ai_source: 'null', is_ai_traffic: 'false',
  },
}).metadata;

describe('getLeadFields', () => {
  it('shows the form answers and hides ids, UTM tags and "null" placeholders', () => {
    const fields = getLeadFields(formLeadMetadata);
    expect(fields.map((field) => [field.label, field.value, field.kind])).toEqual([
      ['Имя', 'Айгерим', 'name'],
      ['Телефон', '+77015551020', 'phone'],
      ['Сообщение', 'Хочу записаться\nв субботу утром', 'message'],
    ]);
  });

  it('never prints [object Object]: arrays are joined, nested objects flattened one level', () => {
    const fields = getLeadFields({
      form_data: {
        services: ['Маникюр', 'Брови'],
        preferred_time: { day: 'Суббота', slot: ['10:00', '12:00'], meta: { tz: 'Asia/Almaty' } },
        agree: true,
        empty: '',
      },
      owner_id: 'x',
      visitor: '409d33c7-8549-4972-9b6c-11fba0aed39d',
    }, { yes: 'Да', no: 'Нет' });
    expect(fields.map((field) => [field.label, field.value])).toEqual([
      ['Services', 'Маникюр, Брови'],
      ['Preferred time · Day', 'Суббота'],
      ['Preferred time · Slot', '10:00, 12:00'],
      ['Preferred time · Meta', 'Asia/Almaty'],
      ['Agree', 'Да'],
    ]);
    expect(fields.some((field) => field.value.includes('[object Object]'))).toBe(false);
  });

  it('translates technical English keys and keeps older top-level answers', () => {
    const fields = getLeadFields(
      { page_id: '11111111-1111-1111-1111-111111111111', message: 'Есть окно в пятницу?', form_name: 'Запись' },
      { labels: { message: 'Сообщение' } },
    );
    expect(fields.map((field) => [field.label, field.value])).toEqual([
      ['Сообщение', 'Есть окно в пятницу?'],
      ['Form name', 'Запись'],
    ]);
  });

  it('returns nothing for empty or non-object metadata', () => {
    expect(getLeadFields(null)).toEqual([]);
    expect(getLeadFields('oops')).toEqual([]);
    expect(getLeadFields([])).toEqual([]);
  });
});

describe('getLeadPreview', () => {
  it('uses the first line of the message', () => {
    expect(getLeadPreview(formLeadMetadata)).toBe('Хочу записаться');
  });

  it('falls back to the first non-contact answer, then the chat question', () => {
    expect(getLeadPreview({ form_data: { 'Имя': 'Марат', 'Услуга': 'Стрижка' } })).toBe('Стрижка');
    expect(getLeadPreview({ chat_lead: true, last_query: 'Сколько стоит маникюр?' })).toBe('Сколько стоит маникюр?');
    expect(getLeadPreview({ form_data: { 'Имя': 'Марат', 'Телефон': '+7700' } })).toBeNull();
  });

  it('shortens very long lines', () => {
    const preview = getLeadPreview({ form_data: { message: 'а'.repeat(300) } });
    expect(preview).toHaveLength(140);
    expect(preview?.endsWith('…')).toBe(true);
  });
});

describe('getLeadAttribution', () => {
  it('drops "null" tags and the "direct" referrer', () => {
    expect(getLeadAttribution(formLeadMetadata)).toEqual({});
    expect(getLeadAttribution({ utm_source: 'instagram', utm_campaign: 'autumn', referrer: 'https://l.instagram.com/' })).toEqual({
      source: 'instagram', campaign: 'autumn', referrer: 'https://l.instagram.com/',
    });
  });
});

describe('humanizeLeadKey', () => {
  it('turns technical keys into words and leaves typed labels alone', () => {
    expect(humanizeLeadKey('preferred_time')).toBe('Preferred time');
    expect(humanizeLeadKey('formName')).toBe('Form Name');
    expect(humanizeLeadKey('Ваше имя')).toBe('Ваше имя');
  });
});
