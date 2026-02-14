import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EventBlock } from '../EventBlock';
import type { EventBlock as EventBlockType } from '@/types/page';

// Mock dependencies
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: null }),
}));

vi.mock('@/platform/supabase/client', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({
          in: () => ({
            select: vi.fn().mockResolvedValue({ count: 0 }),
          }),
        }),
      }),
    }),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
    },
  },
}));

vi.mock('@/services/events', () => ({
  getEventRegistrationCount: vi.fn().mockResolvedValue(0),
  isEmailRegistered: vi.fn().mockResolvedValue(false),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback: string) => fallback || key,
    i18n: { language: 'ru' },
  }),
}));

const mockEventBlock: EventBlockType = {
  id: 'event-123',
  type: 'event',
  eventId: 'evt-uuid-123',
  title: { ru: 'Тест-ивент', en: 'Test Event', kk: 'Тест-оқиға' },
  description: { ru: 'Описание', en: 'Description', kk: 'Сипаттама' },
  startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  endAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
  timezone: 'Asia/Almaty',
  capacity: 100,
  isPaid: false,
  status: 'published',
  formFields: [],
  settings: { requireApproval: false, allowDuplicateEmail: false },
};

describe('EventBlock', () => {
  it('renders event title', () => {
    render(
      <EventBlock 
        block={mockEventBlock} 
        pageOwnerId="owner-123" 
        pageId="page-123" 
      />
    );
    
    expect(screen.getByText('Тест-ивент')).toBeInTheDocument();
  });

  it('renders event description', () => {
    render(
      <EventBlock 
        block={mockEventBlock} 
        pageOwnerId="owner-123" 
        pageId="page-123" 
      />
    );
    
    expect(screen.getByText('Описание')).toBeInTheDocument();
  });

  it('shows free badge for non-paid events', () => {
    render(
      <EventBlock 
        block={mockEventBlock} 
        pageOwnerId="owner-123" 
        pageId="page-123" 
      />
    );
    
    expect(screen.getByText('Free')).toBeInTheDocument();
  });

  it('shows register button', () => {
    render(
      <EventBlock 
        block={mockEventBlock} 
        pageOwnerId="owner-123" 
        pageId="page-123" 
      />
    );
    
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('displays capacity when set', () => {
    render(
      <EventBlock 
        block={mockEventBlock} 
        pageOwnerId="owner-123" 
        pageId="page-123" 
      />
    );
    
    // Should show available spots (100 - 0 registrations)
    expect(screen.getByText(/100/)).toBeInTheDocument();
  });
});
