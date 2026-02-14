/**
 * Test utilities with providers for component testing
 */
import { ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

// Create a mock AuthContext for tests
const mockAuthValue = {
  user: null,
  session: null,
  loading: false,
  signUp: vi.fn().mockResolvedValue({ error: null }),
  signIn: vi.fn().mockResolvedValue({ error: null }),
  signInWithGoogle: vi.fn().mockResolvedValue({ error: null }),
  signInWithApple: vi.fn().mockResolvedValue({ error: null }),
  signOut: vi.fn().mockResolvedValue(undefined),
};

// Create a simple context for testing
import { createContext, useContext } from 'react';

const TestAuthContext = createContext(mockAuthValue);

export function MockAuthProvider({ 
  children, 
  value = mockAuthValue 
}: { 
  children: ReactNode;
  value?: typeof mockAuthValue;
}) {
  return (
    <TestAuthContext.Provider value={value}>
      {children}
    </TestAuthContext.Provider>
  );
}

// Re-export the mock hook for tests to use
export const useMockAuth = () => useContext(TestAuthContext);

// Create test query client
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
}

// All providers wrapper for tests
interface AllProvidersProps {
  children: ReactNode;
  authValue?: typeof mockAuthValue;
}

export function AllProviders({ children, authValue }: AllProvidersProps) {
  const queryClient = createTestQueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      <MockAuthProvider value={authValue || mockAuthValue}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </MockAuthProvider>
    </QueryClientProvider>
  );
}

// Custom render function that includes all providers
export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { authValue?: typeof mockAuthValue }
) {
  const { authValue, ...renderOptions } = options || {};
  
  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders authValue={authValue}>{children}</AllProviders>
    ),
    ...renderOptions,
  });
}

// Export default auth mock for direct access
export { mockAuthValue };

// Mock editor history factory
export function createMockEditorHistory(overrides = {}) {
  return {
    currentBlocks: [],
    history: [],
    currentIndex: 0,
    canUndo: false,
    canRedo: false,
    historyLength: 0,
    undo: vi.fn(),
    redo: vi.fn(),
    clear: vi.fn(),
    clearHistory: vi.fn(),
    resetWithBlocks: vi.fn(),
    recordAction: vi.fn(),
    recordBlockAdd: vi.fn(),
    recordBlockDelete: vi.fn(),
    recordBlockUpdate: vi.fn(),
    recordBlocksReorder: vi.fn(),
    pushAction: vi.fn(),
    ...overrides,
  };
}
