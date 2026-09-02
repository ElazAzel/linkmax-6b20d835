/**
 * useAuth Hook Tests
 * Tests authentication state management, sign in/out flows, and session handling
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/hooks/user/useAuth';

// Mock supabase
const mockSignUp = vi.fn();
const mockSignInWithPassword = vi.fn();
const mockSignInWithOAuth = vi.fn();
const mockSignOut = vi.fn();
const mockGetSession = vi.fn();
const mockOnAuthStateChange = vi.fn();
const mockSetSession = vi.fn();

vi.mock('@/platform/supabase/client', () => ({
    supabase: {
        auth: {
            signUp: (...args: unknown[]) => mockSignUp(...args),
            signInWithPassword: (...args: unknown[]) => mockSignInWithPassword(...args),
            signInWithOAuth: (...args: unknown[]) => mockSignInWithOAuth(...args),
            signOut: () => mockSignOut(),
            setSession: (...args: unknown[]) => mockSetSession(...args),
            getSession: () => mockGetSession(),
            onAuthStateChange: (callback: (event: string, session: unknown) => void) => {
                mockOnAuthStateChange(callback);
                return { data: { subscription: { unsubscribe: vi.fn() } } };
            },
        },
        from: vi.fn(() => ({
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ error: null }),
        })),
        functions: {
            invoke: vi.fn().mockResolvedValue({ data: { valid: true }, error: null }),
        },
    },
}));

// Mock logger
vi.mock('@/lib/utils/logger', () => ({
    logger: {
        debug: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
        info: vi.fn(),
    },
}));

vi.mock('@/lib/posthog', () => ({
    posthog: {
        identify: vi.fn(),
        reset: vi.fn(),
    },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
);

describe('useAuth', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.localStorage.clear();
        mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('initialization', () => {
        it('throws error when used outside AuthProvider', () => {
            const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
            expect(() => {
                renderHook(() => useAuth());
            }).toThrow('useAuth must be used within an AuthProvider');
            expect(consoleError).toHaveBeenCalled();
            consoleError.mockRestore();
        });

        it('starts with loading state', async () => {
            const { result } = renderHook(() => useAuth(), { wrapper });
            expect(result.current.loading).toBe(true);
            await waitFor(() => expect(result.current.loading).toBe(false));
        });

        it('sets user to null when no session exists', async () => {
            const { result } = renderHook(() => useAuth(), { wrapper });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.user).toBeNull();
            expect(result.current.session).toBeNull();
        });

        it('loads existing session on mount', async () => {
            const mockSession = {
                user: { id: 'user-123', email: 'test@example.com' },
                access_token: 'token-123',
            };

            mockGetSession.mockResolvedValueOnce({ data: { session: mockSession }, error: null });

            const { result } = renderHook(() => useAuth(), { wrapper });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            expect(result.current.user?.id).toBe('user-123');
            expect(result.current.session).toBe(mockSession);
        });
    });

    describe('signUp', () => {
        it('calls supabase signUp with email and password', async () => {
            mockSignUp.mockResolvedValueOnce({ data: { user: { id: '123' }, session: null }, error: null });

            const { result } = renderHook(() => useAuth(), { wrapper });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            await act(async () => {
                const { error } = await result.current.signUp('test@example.com', 'password123');
                expect(error).toBeNull();
            });

            expect(mockSignUp).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123',
                options: expect.objectContaining({
                    emailRedirectTo: expect.stringContaining('/auth/callback'),
                }),
            });
        });

        it('returns error on signUp failure', async () => {
            const mockError = { message: 'Email already registered' };
            mockSignUp.mockResolvedValueOnce({ data: null, error: mockError });

            const { result } = renderHook(() => useAuth(), { wrapper });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            await act(async () => {
                const { error } = await result.current.signUp('test@example.com', 'password123');
                expect(error).toBe(mockError);
            });
        });
    });

    describe('signIn', () => {
        it('calls supabase signInWithPassword', async () => {
            mockSignInWithPassword.mockResolvedValueOnce({ data: { user: { id: '123' }, session: {} }, error: null });

            const { result } = renderHook(() => useAuth(), { wrapper });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            await act(async () => {
                const { error } = await result.current.signIn('test@example.com', 'password123');
                expect(error).toBeNull();
            });

            expect(mockSignInWithPassword).toHaveBeenCalledWith({
                email: 'test@example.com',
                password: 'password123',
            });
        });

        it('returns error on invalid credentials', async () => {
            const mockError = { message: 'Invalid login credentials' };
            mockSignInWithPassword.mockResolvedValueOnce({ data: null, error: mockError });

            const { result } = renderHook(() => useAuth(), { wrapper });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            await act(async () => {
                const { error } = await result.current.signIn('test@example.com', 'wrongpassword');
                expect(error).toBe(mockError);
            });
        });
    });

    describe('signInWithGoogle', () => {
        it('calls supabase signInWithOAuth with google provider', async () => {
            mockSignInWithOAuth.mockResolvedValueOnce({ error: null });

            const { result } = renderHook(() => useAuth(), { wrapper });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            await act(async () => {
                const { error } = await result.current.signInWithGoogle();
                expect(error).toBeNull();
            });

            expect(mockSignInWithOAuth).toHaveBeenCalledWith({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback?returnTo=%2Fdashboard`,
                },
            });
        });

        it('passes a safe returnTo through the auth callback', async () => {
            mockSignInWithOAuth.mockResolvedValueOnce({ error: null });

            const { result } = renderHook(() => useAuth(), { wrapper });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            await act(async () => {
                const { error } = await result.current.signInWithGoogle('/dashboard/settings');
                expect(error).toBeNull();
            });

            expect(mockSignInWithOAuth).toHaveBeenCalledWith({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback?returnTo=%2Fdashboard%2Fsettings`,
                },
            });
        });
    });

    describe('signInWithApple', () => {
        it('calls supabase signInWithOAuth with apple provider', async () => {
            mockSignInWithOAuth.mockResolvedValueOnce({ error: null });

            const { result } = renderHook(() => useAuth(), { wrapper });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            await act(async () => {
                const { error } = await result.current.signInWithApple();
                expect(error).toBeNull();
            });

            expect(mockSignInWithOAuth).toHaveBeenCalledWith({
                provider: 'apple',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback?returnTo=%2Fdashboard`,
                },
            });
        });
    });


    describe('signOut', () => {
        it('calls supabase signOut', async () => {
            mockSignOut.mockResolvedValueOnce(undefined);

            const { result } = renderHook(() => useAuth(), { wrapper });

            await waitFor(() => {
                expect(result.current.loading).toBe(false);
            });

            await act(async () => {
                await result.current.signOut();
            });

            expect(mockSignOut).toHaveBeenCalled();
        });
    });

    describe('device account switching', () => {
        it('restores a saved session and makes it active', async () => {
            const savedSession = {
                user: { id: 'saved-user', email: 'saved@example.com' },
                access_token: 'saved-access-token',
                refresh_token: 'saved-refresh-token',
                expires_at: 1_800_000_000,
            };
            const activeSession = {
                user: { id: 'active-user', email: 'active@example.com' },
                access_token: 'active-access-token',
                refresh_token: 'active-refresh-token',
                expires_at: 1_800_000_000,
            };
            mockGetSession.mockResolvedValueOnce({ data: { session: activeSession }, error: null });
            mockSetSession.mockResolvedValueOnce({ data: { session: savedSession }, error: null });
            window.localStorage.setItem('inkmax_v2_device_auth_accounts', JSON.stringify([{
                userId: savedSession.user.id,
                email: savedSession.user.email,
                accessToken: savedSession.access_token,
                refreshToken: savedSession.refresh_token,
                expiresAt: savedSession.expires_at,
                updatedAt: new Date().toISOString(),
            }]));

            const { result } = renderHook(() => useAuth(), { wrapper });
            await waitFor(() => expect(result.current.loading).toBe(false));

            await act(async () => {
                await expect(result.current.switchDeviceAccount('saved-user')).resolves.toEqual({ error: null });
            });

            expect(mockSetSession).toHaveBeenCalledWith({
                access_token: savedSession.access_token,
                refresh_token: savedSession.refresh_token,
            });
        });
    });

    describe('auth state changes', () => {
        it('updates state on SIGNED_OUT event', async () => {
            const mockSession = {
                user: { id: 'user-123', email: 'test@example.com' },
                access_token: 'token-123',
            };

            mockGetSession.mockResolvedValueOnce({ data: { session: mockSession }, error: null });

            let authCallback: (event: string, session: unknown) => void = () => { };
            mockOnAuthStateChange.mockImplementation((cb) => {
                authCallback = cb;
            });

            const { result } = renderHook(() => useAuth(), { wrapper });

            await waitFor(() => {
                expect(result.current.user?.id).toBe('user-123');
            });

            // Simulate sign out event
            act(() => {
                authCallback('SIGNED_OUT', null);
            });

            expect(result.current.user).toBeNull();
            expect(result.current.session).toBeNull();
        });
    });
});
