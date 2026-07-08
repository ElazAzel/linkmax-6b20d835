import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { supabase } from '@/platform/supabase/client';
import type { Json } from '@/platform/supabase/types';
import type { ReviewRequestRpcResult } from '@/services/reviews';

type RpcCall = {
  name: string;
  args: Record<string, unknown>;
};

let getPayload: Json;
let submitPayload: Json;
const rpcCalls: RpcCall[] = [];

const validRequest: ReviewRequestRpcResult = {
  success: true,
  review_request: {
    id: 'request-id',
    status: 'pending',
    booking_id: 'booking-id',
    expires_at: '2099-07-16T00:00:00.000Z',
    default_reviewer_display_name: 'Айдана',
  },
  page: {
    id: 'page-id',
    slug: 'beauty-master',
    title: 'Beauty Studio',
    avatar_url: null,
    city: 'Алматы',
  },
  booking: {
    id: 'booking-id',
    slot_date: '2026-07-02',
    slot_time: '15:30',
  },
};

async function renderReviewRequest(path = '/review/request/rv_token') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const ReviewRequest = (await import('../ReviewRequest')).default;

  return render(
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/review/request/:token" element={<ReviewRequest />} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </HelmetProvider>,
  );
}

describe('ReviewRequest page', () => {
  beforeEach(() => {
    rpcCalls.length = 0;
    getPayload = validRequest as unknown as Json;
    submitPayload = {
      success: true,
      review_request: {
        id: 'request-id',
        status: 'used',
        review_id: 'review-id',
      },
      review: {
        id: 'review-id',
        status: 'pending',
      },
    } as Json;

    Object.assign(supabase, {
      rpc: async (name: string, args: Record<string, unknown>) => {
        rpcCalls.push({ name, args });

        if (name === 'get_review_request_by_token') {
          return { data: getPayload, error: null };
        }

        if (name === 'submit_review_request') {
          return { data: submitPayload, error: null };
        }

        return { data: null, error: null };
      },
    });
  });

  it('renders the token context and submits a verified review request', async () => {
    await renderReviewRequest();

    expect(await screen.findByText('Как прошла услуга?')).toBeInTheDocument();
    expect(screen.getByText(/Beauty Studio/)).toBeInTheDocument();
    expect(screen.getByText(/Запись:/)).toBeInTheDocument();
    expect(screen.getByDisplayValue('Айдана')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('radio', { name: 'Оценка 5 из 5' }));
    fireEvent.change(screen.getByLabelText('Что понравилось или что можно улучшить'), {
      target: { value: 'Все прошло отлично' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Отправить отзыв/ }));

    await waitFor(() => {
      expect(rpcCalls).toContainEqual({
        name: 'submit_review_request',
        args: expect.objectContaining({
          p_token: 'rv_token',
          p_rating: 5,
          p_body: 'Все прошло отлично',
          p_reviewer_display_name: 'Айдана',
        }),
      });
    });

    expect(await screen.findByText('Спасибо, отзыв отправлен')).toBeInTheDocument();
  });

  it('keeps validation local when rating is missing', async () => {
    await renderReviewRequest();

    expect(await screen.findByText('Как прошла услуга?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Отправить отзыв/ }));

    expect(await screen.findByText('Выберите оценку от 1 до 5.')).toBeInTheDocument();
    expect(rpcCalls.some((call) => call.name === 'submit_review_request')).toBe(false);
  });

  it('shows a clear expired-link state', async () => {
    getPayload = {
      success: false,
      error: 'review_request_expired',
      review_request: {
        id: 'request-id',
        status: 'expired',
      },
    } as Json;

    await renderReviewRequest();

    expect(await screen.findByText('Срок действия ссылки истек')).toBeInTheDocument();
    expect(screen.getByText('Чтобы оставить отзыв, запросите у мастера новую ссылку.')).toBeInTheDocument();
  });
});
