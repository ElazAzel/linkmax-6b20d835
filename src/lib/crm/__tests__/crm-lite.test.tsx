import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  CRM_LITE_STAGE_ORDER,
  getDefaultStageLabel,
  getCustomStageLabels,
  setCustomStageLabels,
  resetCustomStageLabels,
  resolveStageLabel,
  encodeTaskInteraction,
  parseTaskInteraction,
  isTaskInteraction,
} from '../crm-lite';
import { StageSettingsDialog } from '@/components/crm/StageSettingsDialog';

describe('CRM Lite stages & tasks', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('uses human-friendly Russian stage labels by default (Новые → Связались → Записан → Оплатил → Завершено)', () => {
    const labels = CRM_LITE_STAGE_ORDER.map((s) => getDefaultStageLabel(s, 'ru'));
    expect(labels).toEqual(['Новые', 'Связались', 'Записан', 'Оплатил', 'Завершено']);
  });

  it('allows renaming stages and persists custom labels', () => {
    setCustomStageLabels({ qualified: 'Консультация назначена', converted: 'Предоплата получена' });
    const custom = getCustomStageLabels();
    expect(resolveStageLabel('qualified', custom, 'ru')).toBe('Консультация назначена');
    expect(resolveStageLabel('converted', custom, 'ru')).toBe('Предоплата получена');
    expect(resolveStageLabel('new', custom, 'ru')).toBe('Новые');

    resetCustomStageLabels();
    expect(getCustomStageLabels()).toEqual({});
  });

  it('encodes and parses lead tasks stored in lead_interactions', () => {
    const encoded = encodeTaskInteraction('Отправить КП в WhatsApp', false, '2026-10-25');
    expect(encoded).toBe('[TASK:open|due=2026-10-25] Отправить КП в WhatsApp');
    expect(isTaskInteraction({ content: encoded })).toBe(true);
    expect(isTaskInteraction({ content: 'Обычная заметка' })).toBe(false);

    const parsed = parseTaskInteraction({
      id: 'task-1',
      content: encoded,
      created_at: '2026-10-19T10:00:00Z',
    });
    expect(parsed).toEqual({
      id: 'task-1',
      done: false,
      dueDate: '2026-10-25',
      text: 'Отправить КП в WhatsApp',
      createdAt: '2026-10-19T10:00:00Z',
    });

    const toggled = encodeTaskInteraction(parsed!.text, !parsed!.done, parsed!.dueDate);
    const parsedDone = parseTaskInteraction({
      id: 'task-1',
      content: toggled,
      created_at: '2026-10-19T10:00:00Z',
    });
    expect(parsedDone?.done).toBe(true);
  });

  it('renders StageSettingsDialog and saves renamed stage', () => {
    let open = true;
    render(
      <StageSettingsDialog
        open={open}
        onOpenChange={(next) => {
          open = next;
        }}
      />,
    );

    const input = screen.getByTestId('crm-stage-input-qualified') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Бронь подтверждена' } });
    fireEvent.click(screen.getByTestId('crm-stage-save'));

    expect(getCustomStageLabels().qualified).toBe('Бронь подтверждена');
    expect(open).toBe(false);
  });
});
