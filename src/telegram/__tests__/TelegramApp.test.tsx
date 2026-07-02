import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TelegramApp from '../TelegramApp';
import { supabase } from '@/platform/supabase/client';

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const renderApp = () => render(<QueryClientProvider client={queryClient}><TelegramApp /></QueryClientProvider>);

// Mock Supabase
vi.mock('@/platform/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn(() => Promise.resolve({ data: { id: '1' }, error: null })),
        })),
        limit: vi.fn(() => ({
          maybeSingle: vi.fn(() => Promise.resolve({ data: { id: '1' }, error: null })),
        })),
      })),
    })),
    functions: {
      invoke: vi.fn(() => Promise.resolve({ data: { valid: true, user: { id: 1, first_name: 'Test' } }, error: null })),
    },
    auth: {
      setSession: vi.fn(() => Promise.resolve({ data: { session: {} }, error: null })),
    },
  },
}));

// Mock auth/zone hooks that require provider context
vi.mock('@/hooks/user/useAuth', () => ({
  useAuth: () => ({ user: null, session: null, loading: false }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock('@/hooks/zones/useZones', () => ({
  useZones: () => ({ zones: [], currentZone: null, loading: false, switchZone: vi.fn() }),
}));

describe('TelegramApp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock Telegram WebApp SDK
    (window as any).Telegram = {
      WebApp: {
        ready: vi.fn(),
        expand: vi.fn(),
        onEvent: vi.fn(),
        initData: 'query_id=test&user={"id":123,"first_name":"Test"}&auth_date=123&hash=test',
        initDataUnsafe: {
          user: { id: 123, first_name: 'Test' },
          start_param: 'home'
        },
        platform: 'ios',
        colorScheme: 'dark',
        themeParams: {},
        BackButton: {
          show: vi.fn(),
          hide: vi.fn(),
          onClick: vi.fn(),
          offClick: vi.fn(),
        },
        MainButton: {
          show: vi.fn(),
          hide: vi.fn(),
          onClick: vi.fn(),
          offClick: vi.fn(),
        },
        close: vi.fn(),
      },
    };
  });

  it('renders loading state initially', async () => {
    renderApp();
    // Since validateAuth is async, it should show a loading state if we had one in the UI
    // In current implementation, TelegramRouter renders screens based on state
  });

  it('calls Telegram.ready() on mount', async () => {
    renderApp();
    expect(window.Telegram!.WebApp.ready).toHaveBeenCalled();
  });

  it('validates auth with server on mount', async () => {
    renderApp();
    await waitFor(() => {
      expect(supabase.functions.invoke).toHaveBeenCalledWith(
        'validate-telegram-miniapp',
        expect.any(Object)
      );
    });
  });
});
