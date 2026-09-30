import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OffersScreen } from '../OffersScreen';
import type { PageData } from '@/types/page';

vi.mock('react-i18next', () => ({ useTranslation: () => ({
  i18n: { language: 'ru' },
  t: (key: string, fallback: string = key, values: Record<string, unknown> = {}) =>
    fallback.replace(/\{\{(\w+)\}\}/g, (_, name: string) => String(values[name] ?? '')),
}) }));

const page = { blocks: [
  { id: 'prices', type: 'pricing', currency: 'KZT', items: [
    { id: 'lesson', name: 'English lesson', price: 7500, duration: 60, serviceOfferingId: 'lesson-service' },
  ] },
  { id: 'booking', type: 'booking', title: 'Book a lesson', slotDuration: 60, serviceOfferingIds: ['lesson-service'] },
] } as PageData;

describe('OffersScreen', () => {
  it('opens the actual pricing and linked availability blocks without duplicating a service', () => {
    const edit = vi.fn();
    render(<OffersScreen pageData={page} loading={false} onEditBlock={edit} onInsertBlock={vi.fn()} onOpenPage={vi.fn()} />);
    expect(screen.getAllByText('English lesson')).toHaveLength(1);
    expect(screen.getByText(/7\s?500/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Изменить услугу: English lesson' }));
    expect(edit).toHaveBeenLastCalledWith(page.blocks[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Настроить время записи: Book a lesson' }));
    expect(edit).toHaveBeenLastCalledWith(page.blocks[1]);
  });

  it('creates a pricing block from an empty page, not a fictitious priced lesson', () => {
    const insert = vi.fn();
    render(<OffersScreen pageData={{ blocks: [] } as unknown as PageData} loading={false} onEditBlock={vi.fn()} onInsertBlock={insert} onOpenPage={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Добавить первую услугу' }));
    expect(insert).toHaveBeenCalledWith('pricing');
  });

  it('never presents a legacy booking deposit as its full price', () => {
    render(<OffersScreen pageData={{ blocks: [{ id: 'old', type: 'booking', title: 'Consultation', slotDuration: 30, depositAmount: 0 }] } as unknown as PageData}
      loading={false} onEditBlock={vi.fn()} onInsertBlock={vi.fn()} onOpenPage={vi.fn()} />);
    expect(screen.getByText('Цена не указана')).toBeInTheDocument();
    expect(screen.queryByText('Бесплатно')).not.toBeInTheDocument();
  });
});
